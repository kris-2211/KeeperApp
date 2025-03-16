const express = require("express");
const jwt = require("jsonwebtoken");
const Note = require("../models/Note");
const User = require("../models/User");

const router = express.Router();

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(404).json({ success: false, message: "User not found" });

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// Create a Note
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, checklist } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    // Create the note with checklist (if provided)
    const note = new Note({
      user: req.user._id,
      title,
      content,
      checklist, // checklist can be an empty array or array of items
    });
    await note.save();

    req.user.notes.push(note._id);
    await req.user.save();

    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get All Notes for Logged-in User
router.get("/", authenticate, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Update a Note
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, content, checklist } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note || note.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    note.title = title;
    note.content = content;
    note.checklist = checklist; // Update the checklist field
    await note.save();

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Delete a Note
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note || note.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    await note.deleteOne();
    req.user.notes.pull(req.params.id);
    await req.user.save();

    res.json({ success: true, message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
