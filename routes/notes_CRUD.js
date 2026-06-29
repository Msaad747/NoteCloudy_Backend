import express from "express";
import User from "../Models/Users.js";
import Notes from "../Models/Notes.js";
import { verifyToken } from "../authJwt.js";
import { body, validationResult } from "express-validator";
import "dotenv/config";

const notes_router = express.Router();

// CREATE NOTE
notes_router.post(
  "/createNote",
  verifyToken,
  [
    body("title")
      .isLength({ min: 3, max: 20 })
      .withMessage("Title must be between 3 and 20 characters"),
    body("description").optional(),
    body("tags").optional(),
  ],
  async (req, res) => {
    // Check for validation errors
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, tag } = req.body;

      const userId = req.user.userId; // Get userId from the verified token

      const note = await Notes.create({
        title,
        description,
        tag: tag === "" ? undefined : tag,
        userId,
      });
      res.status(201).json({ message: "Note created successfully", note });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);
// FETCH ALL NOTES FOR THE LOGGED-IN USER
notes_router.get("/fetchAllNotes", verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // If admin, fetch all notes; otherwise fetch only user's notes
    if (req.user.isAdmin) {
      const allNotes = await Notes.findAll();
      return res
        .status(200)
        .json({ notes: allNotes, source: "admin - all notes" });
    }

    const notes = await Notes.findAll({ where: { userId } });
    res.status(200).json({ notes, source: "user - own notes" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE NOTE
notes_router.put(
  "/updateNote/:id",
  verifyToken,
  [
    body("title")
      .optional()
      .isLength({ min: 3, max: 20 })
      .withMessage("Title must be between 3 and 20 characters"),
    body("description")
      .optional()
      .isLength({ min: 10, max: 255 })
      .withMessage("Description must be between 10 and 255 characters"),
    body("tag").optional().isString().withMessage("Tags must be a string"),
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, tag } = req.body;

      const note = await Notes.findByPk(id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Check if the user is the owner of the note or an admin
      if (note.userId !== req.user.userId && !req.user.isAdmin) {
        return res
          .status(403)
          .json({ message: "Unauthorized to update this note" });
      }
      const updatedTitle = title ?? note.title;
      const updatedDescription = description ?? note.description;
      const updatedTag =
        tag?.trim() === "" || tag === undefined ? "General" : tag;
      await note.update({
        title: updatedTitle,
        description: updatedDescription,
        tag: updatedTag,
      });
      res.status(200).json({ message: "Note updated successfully", note });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// DELETE NOTE
notes_router.delete("/deleteNote/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const note = await Notes.findByPk(id);
    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }
    //  delete if user is admin
    if (req.user.isAdmin) {
      await note.destroy();
      return res
        .status(200)
        .json({ message: "Note deleted successfully by admin" });
    }
    // Check if the user is the owner of the note or admin
    if (note.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this note" });
    }

    await note.destroy();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default notes_router;
