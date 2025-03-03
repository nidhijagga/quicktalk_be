// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
	try {
		// Use environment variable MONGO_URI or fallback to a local MongoDB URL
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
		process.exit(1); // Exit process with failure
	}
};

module.exports = connectDB;
