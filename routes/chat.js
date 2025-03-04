// routes/chat.js
const express = require("express");
const router = express.Router();
const {
	sendMessage,
	getChatHistory,
} = require("../controllers/chatController");

// Route to send a new message
router.post("/send", sendMessage);

// Route to get chat history between two users (user IDs passed as URL parameters)
router.get("/history/:user1/:user2", getChatHistory);

module.exports = router;
