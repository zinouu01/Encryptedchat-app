const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  resetPasswordWithFace,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-face", resetPasswordWithFace);

module.exports = router;
