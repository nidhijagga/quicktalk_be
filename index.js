// index.js
const express = require("express");
const authRoutes = require("./routes/auth");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());

app.use(
	cors({
		origin: "http://192.168.1.3:3000", // Replace with your frontend URL
		credentials: true, // Allow cookies and other credentials
	})
);
// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();
// Mount authentication routes
// app.use("/", (req, res) => {
// 	res.json({ message: "Welcome to the API" });
// });
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
