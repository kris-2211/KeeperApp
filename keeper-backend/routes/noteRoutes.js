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

// Create a Note (Now includes location)
router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, checklist, location } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    // Create the note with optional location
    const note = new Note({
      user: req.user._id,
      title,
      content,
      checklist,
      location: location && location.coordinates.length === 2 ? location : undefined,
    });

    await note.save();
    req.user.notes.push(note._id);
    await req.user.save();

    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get All Notes for Logged-in User (Includes location data)
router.get("/", authenticate, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id });
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Update a Note (Now supports updating location)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, content, checklist, location } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note || note.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, message: "Title and content are required." });
    }

    note.title = title;
    note.content = content;
    note.checklist = checklist;
    note.location = location && location.coordinates.length === 2 ? location : note.location;

    await note.save();
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Get Notes Near User Location (For background task notifications)
router.get("/nearby", authenticate, async (req, res) => {
  try {
    const { longitude, latitude, radius = 500 } = req.query; // Radius in meters

    if (!longitude || !latitude) {
      return res.status(400).json({ success: false, message: "Longitude and latitude are required." });
    }

    const nearbyNotes = await Note.find({
      user: req.user._id,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(radius),
        },
      },
    });

    res.json({ success: true, notes: nearbyNotes });
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
