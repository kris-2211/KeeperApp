const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Note belongs to a user
  title: { type: String, required: true },
  content: { type: String, default: "" }, // Rich text content from the editor
  checklist: [
    {
      text: { type: String, default: "" },  // Label for the checklist item
      checked: { type: Boolean, default: false } // Status of the checklist item
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
