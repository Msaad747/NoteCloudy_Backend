import express from "express";
import User from "../Models/Users.js";
import "dotenv/config";
import { body, validationResult } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken } from "../authJwt.js";
import { isAdmin } from "../isAdmin.js";

const router = express.Router();

// CREATE USER
router.post(
  "/createuser",
  [
    body("name")
      .isLength({ min: 3, max: 20 })
      .withMessage("Name must be between 3 and 20 characters"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, age } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const isAdmin = email === process.env.ADMIN_EMAIL;
      console.log(isAdmin);
      console.log(req.body);
      const user = await User.create({
        ...req.body,
        password: hashedPassword,
        age:age??null,
        isAdmin,
      });

      const userData = user.toJSON();
      delete userData.isAdmin;

      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      );

    return  res.json({
        message: "User created",
        user: userData,
        token:token,
      });
    } catch (err) {
  console.error("Signup Error:", err);

  return res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
}
  },
);

// GET ALL USERS
router.get("/", verifyToken, isAdmin, async (req, res) => {
  const users = await User.findAll();
  res.json(users.map((u) => u.name));
});

// GET USER BY ID
router.get("/:id", verifyToken, async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!req.user.isAdmin && req.user.userId !== user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  res.json(user);
});

// UPDATE USER
router.put(
  "/:id",
  [
    body("authpassword").exists().withMessage("AuthPassword is required"),
    body("name")
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage("Name must be between 3 and 20 characters"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("password")
      .optional()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  verifyToken,
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      // check if user exists
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const { name, email, password, age } = req.body;

      let updatedName = name ? name : user.name;
      let updatedEmail = email ? email : user.email;

      const hashedPassword = password
        ? await bcrypt.hash(password, 10)
        : user.password;

      await user.update({
        name: updatedName,
        email: updatedEmail,
        password: hashedPassword,
        age: age ?? user.age,
      });
      return res.json({
        message: "User updated successfully",
        user,
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);

// DELETE USER
router.delete(
  "/:id",
  verifyToken,
  [body("password").optional()],
  async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Admin can delete anyone
      if (req.user.isAdmin) {
        await user.destroy();

        return res.json({
          message: "User deleted by admin",
        });
      }

      // Non-admins can only delete themselves
      if (req.user.userId !== user.id) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }

      // const { password } = req.body;

      // if (!password) {
      //   return res.status(400).json({
      //     message: "Password is required",
      //   });
      // }

      // const comparePass = await bcrypt.compare(password, user.password);

      // if (!comparePass) {
      //   return res.status(401).json({
      //     message: "Incorrect password",
      //   });
      // }

      await user.destroy();

      res.json({
        message: "User deleted",
      });
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  },
);
export default router;
