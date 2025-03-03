// controllers/authController.js
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ensure this model hashes passwords and implements comparePassword method
const RefreshToken = require("../models/RefreshToken"); // Model to store refresh tokens
require("dotenv").config();
const bcrypt = require("bcrypt");

// Signup controller: Creates a new user
exports.signup = async (req, res) => {
	try {
		const { username, email, password } = req.body;
		// Check if the user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}
		// Create a new user (assume password hashing occurs in a pre-save hook)
		const newUser = new User({ username, email, password });
		await newUser.save();
		return res.status(201).json({ message: "User created successfully" });
	} catch (error) {
		console.error("Signup error:", error);
		return res.status(500).json({ message: "Server error during signup" });
	}
};

// Login controller: Authenticates user & issues tokens
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		// Find the user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		// Check if the password is correct
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({ message: "Incorrect password" });
		}
		// Generate a short-lived access token (e.g., 15 minutes)
		const accessToken = jwt.sign(
			{ userId: user._id },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" }
		);
		// Generate a long-lived refresh token (e.g., 7 days)
		const refreshToken = jwt.sign(
			{ userId: user._id },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "7d" }
		);
		// Store the refresh token in the database for rotation/blacklisting purposes
		await RefreshToken.create({ token: refreshToken, user: user._id });
		// Set the refresh token as an httpOnly cookie and send the access token in the response body
		return res
			.cookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production", // Use secure cookies in production
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
			})
			.status(200)
			.json({ accessToken, message: "Login successful" });
	} catch (error) {
		console.error("Login error:", error);
		return res.status(500).json({ message: "Server error during login" });
	}
};

// Refresh controller: Rotates refresh token and issues a new access token
exports.refreshToken = async (req, res) => {
	try {
		const oldRefreshToken = req.cookies.refreshToken;
		if (!oldRefreshToken) {
			return res
				.status(401)
				.json({ message: "Refresh token not provided" });
		}
		let payload;
		try {
			payload = jwt.verify(
				oldRefreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);
		} catch (err) {
			return res.status(403).json({ message: "Invalid refresh token" });
		}
		// Check if the refresh token exists in the database (for blacklisting purposes)
		const tokenRecord = await RefreshToken.findOne({
			token: oldRefreshToken,
			user: payload.userId,
		});
		if (!tokenRecord) {
			return res
				.status(403)
				.json({ message: "Refresh token not recognized" });
		}
		// Delete the old refresh token (token rotation)
		await RefreshToken.deleteOne({ token: oldRefreshToken });
		// Issue new tokens
		const newAccessToken = jwt.sign(
			{ userId: payload.userId },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" }
		);
		const newRefreshToken = jwt.sign(
			{ userId: payload.userId },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: "7d" }
		);
		// Store the new refresh token in the database
		await RefreshToken.create({
			token: newRefreshToken,
			user: payload.userId,
		});
		// Set the new refresh token in the httpOnly cookie and send the new access token in the response
		return res
			.cookie("refreshToken", newRefreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "Strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
			})
			.status(200)
			.json({
				accessToken: newAccessToken,
				message: "Token refreshed successfully",
			});
	} catch (error) {
		console.error("Refresh token error:", error);
		return res
			.status(500)
			.json({ message: "Server error during token refresh" });
	}
};

// Logout controller: Clears the refresh token from DB and cookie
exports.logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			await RefreshToken.deleteOne({ token: refreshToken });
			res.clearCookie("refreshToken");
		}
		return res.status(200).json({ message: "Logout successful" });
	} catch (error) {
		console.error("Logout error:", error);
		return res.status(500).json({ message: "Server error during logout" });
	}
};
