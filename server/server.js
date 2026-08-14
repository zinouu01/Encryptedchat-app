const http = require("http");
const mongoose = require("mongoose");
const { WebSocketServer, WebSocket } = require("ws");
const app = require("./app");
const Message = require("./models/Message");

const PORT = process.env.PORT || 8081;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log(`✅ Client connected (${wss.clients.size} total)`);

  ws.on("message", async (rawMessage) => {
    try {
      const messageString = rawMessage.toString();
      const data = JSON.parse(messageString);

      // Only process valid messages
      if (data.type === "message" && data.payload) {
        const { from, to, groupId, encrypted } = data.payload;

        // --- DEBUG LOGS (Check your terminal for these!) ---
        console.log("\n📥 Message Received:");
        console.log("   From:", from);
        console.log("   To:", to || "N/A");
        console.log("   Group ID:", groupId || "N/A");
        console.log(
          "   Encrypted Content:",
          encrypted ? encrypted.substring(0, 20) + "..." : "MISSING!"
        );
        // --------------------------------------------------

        // 1. Validate Data Before Saving
        if (!from || !encrypted) {
          console.error("❌ Save Failed: Missing 'from' or 'encrypted' field.");
          return;
        }

        // 2. Prepare Database Object
        let newMessageData = {
          sender: from,
          encryptedContent: encrypted,
          timestamp: new Date(),
        };

        // Handle Private vs Group Logic
        if (groupId) {
          newMessageData.groupId = groupId;
        } else {
          // Ensure 'to' exists for private messages
          newMessageData.recipient = to;
        }

        // 3. Save to MongoDB
        try {
          const savedMessage = await Message.create(newMessageData);
          console.log(
            "💾 SUCCESS: Message saved to DB with ID:",
            savedMessage._id
          );
        } catch (dbError) {
          console.error("❌ MONGODB ERROR:", dbError.message);
        }

        // 4. Broadcast to other clients
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(messageString);
          }
        });
      }
    } catch (e) {
      console.error("❌ WebSocket Error:", e.message);
    }
  });

  ws.on("close", () => console.log("❌ Client disconnected"));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
