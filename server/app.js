require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");

// Initialize Express
const app = express();

// 1. Connect to Database
connectDB();

// 2. Middleware
app.use(cors()); // Allow frontend communication
app.use(express.json()); // Parse JSON bodies

// 3. Mount Routes
// Any request to /api/auth/... goes to the authRoutes file
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
// 4. Export the configured app
module.exports = app;
