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
      collaborators: req.user.email
    });

    await note.save();
    req.user.notes.push(note._id);
    await req.user.save();

    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// Update a Note (Now supports updating location)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, content, checklist, location } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
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

router.get("/:id/owner", authenticate, async (req, res) => {
  try{
    const note = await Note.findById(req.params.id);
    if(!note){
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    const owner = await User.findOne({_id : note.user.toString()});
    res.json({ success: true, message: "Owner fetched successfully", owner });
  }
  catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
})

// ✅ Add a Collaborator to a Note
router.put("/:id/add-collaborator", authenticate, async (req, res) => {
  try {
    const { collaboratorEmail } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });

    // Ensure user is the owner
    const owner = await User.findOne({_id : note.user.toString()});
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to add collaborators, request " + 
        owner.fullname + " (Owner) to add them instead"});
    }

    // Find collaborator user
    const collaborator = await User.findOne({ email: collaboratorEmail });
    if (!collaborator) return res.status(404).json({ success: false, message: "User not found" });

    // Check if already added
    if (note.collaborators?.includes(collaboratorEmail)) {
      return res.status(400).json({ success: false, message: "User is already a collaborator" });
    }

    // Add collaborator email
    note.collaborators = note.collaborators || [];
    note.collaborators.push(collaboratorEmail);
    await note.save();

    res.json({ success: true, message: "Collaborator added successfully", note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ✅ Remove a Collaborator from a Note
router.put("/:id/remove-collaborator", authenticate, async (req, res) => {
  try {
    const { collaboratorEmail } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });

    // Ensure user is the owner
    const owner = await User.findOne({_id : note.user.toString()});
    if (note.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to remove collaborators, request " + 
        owner.fullname + " (Owner) to remove them instead" });
    }

    // Remove collaborator email
    note.collaborators = note.collaborators?.filter((email) => email !== collaboratorEmail);
    await note.save();

    res.json({ success: true, message: "Collaborator removed successfully", note });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ✅ Get All Notes (Include Collaborators)
router.get("/", authenticate, async (req, res) => {
  try {
    const notes = await Note.find({
      $or: [{ user: req.user._id }, { collaborators: req.user.email }], // Check for user email in collaborators
    });

    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});


module.exports = router;
