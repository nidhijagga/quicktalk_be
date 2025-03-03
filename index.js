// index.js
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
connectDB();
// Mount authentication routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
