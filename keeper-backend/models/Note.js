const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Note belongs to a user (Owner)
  collaborators: [{ type: String }], // ✅ List of collaborator emails (updated)
  title: { type: String, required: true },
  content: { type: String, default: "" }, // Rich text content from the editor
  checklist: [
    {
      text: { type: String, default: "" },  // Label for the checklist item
      checked: { type: Boolean, default: false } // Status of the checklist item
    }
  ],
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function (arr) {
          return arr.length === 2;
        },
        message: "Coordinates must be an array of [longitude, latitude]",
      },
    },
  },
  category: { type: String }, // Optional future feature
  createdAt: { type: Date, default: Date.now },
});

// Ensure geospatial indexing
NoteSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Note", NoteSchema);