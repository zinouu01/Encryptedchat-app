const express = require("express");
const router = express.Router();
const getMessages = require("./../controllers/messageController");

// Now accepts query params: /api/messages?user1=Me&user2=You
router.get("/", getMessages);

module.exports = router;
