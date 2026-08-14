const User = require("./../models/User");

// @desc    Get all users (includes public keys for chat)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// @desc    Update User's Public Key
// @route   POST /api/users/key
const updatePublicKey = async (req, res) => {
  const { username, publicKey } = req.body;
  try {
    await User.findOneAndUpdate({ username }, { publicKey });
    res.json({ success: true, message: "Public Key Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllUsers, updatePublicKey };
