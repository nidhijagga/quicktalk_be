// index.js
const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const http = require("http");
const socketio = require("socket.io");

dotenv.config();
const app = express();

app.use(cookieParser());
app.use(express.json());

const allowedOrigins = [process.env.CLIENT_URL, process.env.CLIENT_URL2];

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	})
);

// Connect to MongoDB
connectDB();

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
	res.json({ message: "Welcome to the API" });
});

// Create an HTTP server and attach the Express app
const server = http.createServer(app);

// Create a Socket.IO server that shares the HTTP server
const io = socketio(server, {
	cors: {
		origin: [process.env.CLIENT_URL, process.env.CLIENT_URL2],
		methods: ["GET", "POST"],
		credentials: true,
	},
});

const onlineUsers = new Set();

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log("New client connected:", socket.id);

	// When a client joins, you can have them join a room with their userId
	socket.on("join", (userId) => {
		socket.join(userId);
		console.log(`User ${userId} joined room ${userId}`);
	});

	// Listen for sendMessage event from clients
	socket.on("sendMessage", (data) => {
		console.log("Received message:", data);
		// Send message to the recipient's room only
		io.to(data.recipient).emit("message", data);
		// Optionally, emit back to sender as confirmation
		socket.emit("message", data);
	});

	socket.on("typing", (data) => {
		io.to(data.recipient).emit("typing", { sender: data.sender });
	});
	socket.on("stopTyping", (data) => {
		io.to(data.recipient).emit("stopTyping", { sender: data.sender });
	});

	socket.on("join", (userId) => {
		socket.userId = userId;
		onlineUsers.add(userId);
		// Emit the updated online users list to all connected clients
		io.emit("onlineUsers", Array.from(onlineUsers));
		console.log(
			`User ${userId} joined. Online users:`,
			Array.from(onlineUsers)
		);
	});

	socket.on("disconnect", () => {
		if (socket.userId) {
			onlineUsers.delete(socket.userId);
			io.emit("onlineUsers", Array.from(onlineUsers));
			console.log("User disconnected:", socket.userId);
		}
	});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
