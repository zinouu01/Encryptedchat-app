const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Store the face descriptor (array of 128 numbers)
  faceData: { type: [Number], default: [] },
  publicKey: { type: String, default: "" },
});

module.exports = mongoose.model("User", userSchema);
