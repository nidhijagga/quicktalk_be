// models/RefreshToken.js
const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema({
	token: { type: String, required: true },
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
