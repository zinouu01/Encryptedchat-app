const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updatePublicKey,
} = require("./../controllers/userController");

router.get("/", getAllUsers);
router.post("/key", updatePublicKey);

module.exports = router;
