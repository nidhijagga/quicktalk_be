// routes/auth.js
const express = require("express");
const router = express.Router();
const {
	signup,
	login,
	refreshToken,
	logout,
} = require("../controllers/authController");

// Signup & Login routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

module.exports = router;
