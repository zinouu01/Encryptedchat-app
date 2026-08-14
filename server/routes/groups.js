const express = require("express");
const router = express.Router();
const {
  createGroup,
  getUserGroups,
} = require("../controllers/groupController");

router.post("/", createGroup); // Create group
router.get("/", getUserGroups); // Get my groups

module.exports = router;
