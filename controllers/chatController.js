// controllers/chatController.js
const Message = require("../models/Message");

// Endpoint to send a message
exports.sendMessage = async (req, res) => {
	try {
		const { sender, recipient, content } = req.body;
		// Create a new message document
		const newMessage = new Message({ sender, recipient, content });
		await newMessage.save();
		return res.status(201).json({
			status: 201,
			message: "Message sent successfully",
			messageData: newMessage,
		});
	} catch (error) {
		console.error("Send message error:", error);
		return res.status(500).json({
			status: 500,
			message: "Server error while sending message",
		});
	}
};

// Endpoint to retrieve chat history between two users
exports.getChatHistory = async (req, res) => {
	try {
		const { user1, user2 } = req.params;
		// Find messages where the sender and recipient match the two users (in either order)
		const messages = await Message.find({
			$or: [
				{ sender: user1, recipient: user2 },
				{ sender: user2, recipient: user1 },
			],
		}).sort({ createdAt: 1 });
		return res.status(200).json({
			status: 200,
			message: "Chat history fetched successfully",
			messages,
		});
	} catch (error) {
		console.error("Get chat history error:", error);
		return res.status(500).json({
			status: 500,
			message: "Server error while fetching chat history",
		});
	}
};
