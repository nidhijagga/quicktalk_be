// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// Check if user exists
		const existingUser = await User.findOne({ email });
		if (existingUser)
			return res.status(400).json({ message: "User already exists" });

		// Hash password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create and save new user
		const newUser = new User({ username, email, password: hashedPassword });
		await newUser.save();

		res.status(201).json({ message: "User created successfully" });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Check if user exists
		const user = await User.findOne({ email });
		if (!user)
			return res.status(400).json({ message: "Invalid credentials" });

		// Compare password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch)
			return res.status(400).json({ message: "Invalid credentials" });

		// Generate JWT token (use environment variables for the secret in production)
		const token = jwt.sign(
			{ id: user._id },
			process.env.JWT_SECRET || "your_jwt_secret",
			{ expiresIn: "1h" }
		);

		res.json({ token, message: "Logged in successfully" });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
};
