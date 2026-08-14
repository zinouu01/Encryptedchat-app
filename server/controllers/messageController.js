const Message = require("./../models/Message");

// @route   GET /api/messages
// @desc    Get chat history between two people OR for a group
const getMessages = async (req, res) => {
  try {
    const { user1, user2, groupId } = req.query;

    let query = {};

    if (groupId) {
      // SCENARIO 1: Group Chat
      // Fetch messages where groupId matches
      query = { groupId: groupId };
    } else if (user1 && user2) {
      // SCENARIO 2: Private Chat (User1 <-> User2)
      // Fetch messages where sender is User1 AND recipient is User2
      // OR sender is User2 AND recipient is User1
      query = {
        $or: [
          { sender: user1, recipient: user2 },
          { sender: user2, recipient: user1 },
        ],
      };
    } else {
      // Fallback: Return nothing or global broadcast
      return res.json([]);
    }

    const messages = await Message.find(query).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = getMessages;
