const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Note belongs to a user
  title: { type: String, required: true },
  content: [
    {
      _id: false, // Prevents MongoDB from auto-generating IDs for array elements
      type: { type: String, enum: ["text", "checkbox", "image"], required: true }, // Type of content
      text: { type: String }, // For text content
      checked: { type: Boolean, default: false }, // For checkboxes
      imageUrl: { type: String }, // For image content
    }
  ],
  location: { 
    type: { type: String, enum: ["Point"], default: "Point" }, 
    coordinates: { type: [Number] } 
  }, // Optional future feature
  category: { type: String }, // Optional future feature
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Note", NoteSchema);
