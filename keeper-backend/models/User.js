const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "default.png" },
  notes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
});

module.exports = mongoose.model("User", UserSchema);
