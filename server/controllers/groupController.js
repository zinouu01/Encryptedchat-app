const Group = require("./../models/Group");

// Create a Group
const createGroup = async (req, res) => {
  const { name, members, createdBy } = req.body;
  try {
    // Ensure the creator is in the group
    const allMembers = [...new Set([...members, createdBy])];
    const newGroup = await Group.create({
      name,
      members: allMembers,
      createdBy,
    });
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Groups for a User
const getUserGroups = async (req, res) => {
  const { username } = req.query;
  try {
    // Find groups where 'members' array contains the username
    const groups = await Group.find({ members: username });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createGroup, getUserGroups };
