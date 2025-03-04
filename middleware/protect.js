// Middleware to verify token
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// This middleware can be reused for any protected endpoint.
exports.protect = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ status: 401, message: "Not authorized" });
	}
	const token = authHeader.split(" ")[1];
	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		req.userId = decoded.userId;
		next();
	} catch (error) {
		return res
			.status(401)
			.json({ status: 401, message: "Not authorized, token failed" });
	}
};
