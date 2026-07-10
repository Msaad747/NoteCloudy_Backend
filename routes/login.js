import express from "express";
import { body, validationResult } from "express-validator";
import User from "../Models/Users.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken } from "../authJwt.js";
import { isAdmin } from "../isAdmin.js";
import "dotenv/config";

const login_router = express.Router();

// LOGIN
login_router.post(
  "/login",
  [
    body("email")
      .exists()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),
    body("password")
      .exists()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ message: "No User Found!" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      );

      res.status(200).json({
        message: "Login successful",
        token,
        Admin: user.isAdmin,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// GET PROFILE
login_router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ["password", "createdAt", "updatedAt"] },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For admin access

login_router.get("/all-users", verifyToken, isAdmin, async (req, res) => {
  const allUser= await User.findAll();
    res.json(allUser);
});

export default login_router;
