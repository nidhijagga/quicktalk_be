// controllers/authController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User"); // Ensure this model hashes passwords and implements any necessary methods
const RefreshToken = require("../models/RefreshToken"); // Model to store refresh tokens
require("dotenv").config();

// Signup controller: Creates a new user
exports.signup = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// Check if the user already exists
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				status: 400,
				message: "Signup failed: User already exists",
			});
		}

		// Create a new user (assume password hashing occurs in a pre-save hook)
		const newUser = new User({ username, email, password });
		await newUser.save();

		return res
			.status(201)
			.json({ status: 201, message: "User created successfully" });
	} catch (error) {
		console.error("Signup error:", error);
		return res
			.status(500)
			.json({ status: 500, message: "Server error during signup" });
	}
};

// Login controller: Authenticates user & issues tokens
exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Find the user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res
				.status(404)
				.json({ status: 404, message: "Login failed: User not found" });
		}

		// Compare the provided password with the stored hash
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(401).json({
				status: 401,
				message: "Login failed: Incorrect password",
			});
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

		// Store the refresh token in the database for token rotation/blacklisting purposes
		await RefreshToken.create({ token: refreshToken, user: user._id });

		return res.status(200).json({
			status: 200,
			accessToken,
			refreshToken,
			message: "Login successful",
		});
	} catch (error) {
		console.error("Login error:", error);
		return res
			.status(500)
			.json({ status: 500, message: "Server error during login" });
	}
};

// Refresh controller: Rotates refresh token and issues a new access token
exports.refreshToken = async (req, res) => {
	try {
		const oldRefreshToken = req.cookies.refreshToken;
		if (!oldRefreshToken) {
			return res.status(401).json({
				status: 401,
				message: "Token refresh failed: Refresh token not provided",
			});
		}

		let payload;
		try {
			payload = jwt.verify(
				oldRefreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);
		} catch (err) {
			return res.status(403).json({
				status: 403,
				message: "Token refresh failed: Invalid refresh token",
			});
		}

		// Check if the refresh token exists in the database (for blacklisting purposes)
		const tokenRecord = await RefreshToken.findOne({
			token: oldRefreshToken,
			user: payload.userId,
		});
		if (!tokenRecord) {
			return res.status(403).json({
				status: 403,
				message: "Token refresh failed: Refresh token not recognized",
			});
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

		return res.status(200).json({
			status: 200,
			accessToken: newAccessToken,
			refreshToken: newRefreshToken,
			message: "Token refreshed successfully",
		});
	} catch (error) {
		console.error("Refresh token error:", error);
		return res.status(500).json({
			status: 500,
			message: "Server error during token refresh",
		});
	}
};

// Logout controller: Clears the refresh token from DB and cookie
exports.logout = async (req, res) => {
	try {
		const { refreshToken } = req.body;
		if (refreshToken) {
			await RefreshToken.deleteOne({ token: refreshToken });
		}
		return res
			.status(200)
			.json({ status: 200, message: "Logout successful" });
	} catch (error) {
		console.error("Logout error:", error);
		return res
			.status(500)
			.json({ status: 500, message: "Server error during logout" });
	}
};

// Get current user profile
exports.getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res
				.status(404)
				.json({ status: 404, message: "User not found" });
		}
		return res
			.status(200)
			.json({ status: 200, user, message: "User fetched successfully" });
	} catch (error) {
		console.error("Get profile error:", error);
		return res
			.status(500)
			.json({ status: 500, message: "Server error fetching user" });
	}
};
