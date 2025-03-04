// routes/auth.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/protect");
const {
	signup,
	login,
	refreshToken,
	logout,
	getUserProfile,
	getUsers,
} = require("../controllers/authController");

// Signup & Login routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

// Protected route to get current user info
router.get("/user_profile", protect, getUserProfile);
router.get("/users", protect, getUsers);

module.exports = router;
