const bcrypt = require("bcryptjs");
const User = require("./../models/User");

// Helper: Calculate Euclidean Distance between two face descriptors
function getEuclideanDistance(face1, face2) {
  if (!face1 || !face2 || face1.length !== face2.length) return Infinity;
  return Math.sqrt(
    face1.reduce((sum, val, i) => sum + Math.pow(val - face2[i], 2), 0)
  );
}

// @desc    Register a new user with Face Data
const registerUser = async (req, res) => {
  const { username, password, faceDescriptor } = req.body; // <--- Expect faceDescriptor

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with face data
    await User.create({
      username,
      password: hashedPassword,
      faceData: faceDescriptor || [], // Store the array
    });

    res
      .status(201)
      .json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Login (Existing Code - Keep as is)
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    res.json({ success: true, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Reset Password via Face Recognition
// @route   POST /api/auth/reset-face
const resetPasswordWithFace = async (req, res) => {
  const { username, newPassword, faceDescriptor } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    if (!user.faceData || user.faceData.length === 0) {
      return res
        .status(400)
        .json({ error: "No face data registered for this account." });
    }

    // COMPARE FACES
    // Threshold of 0.6 is standard for face-api.js. Lower = stricter.
    const distance = getEuclideanDistance(user.faceData, faceDescriptor);

    if (distance > 0.5) {
      return res
        .status(401)
        .json({ error: "Face verification failed. Not a match." });
    }

    // If match, reset password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Identity verified! Password reset successful.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerUser, loginUser, resetPasswordWithFace };
