const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Note belongs to a user
  title: { type: String, required: true },
  content: { type: String, required: true },
  location: { type: { type: String, enum: ["Point"], default: "Point" }, coordinates: { type: [Number] } }, // Optional future feature
  category: { type: String }, // Optional future feature
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Note", NoteSchema);
