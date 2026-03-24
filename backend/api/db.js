const mongoose = require('mongoose');

let cachedConnection = null;
let cachedConnectionPromise = null;

mongoose.connection.on('connected', () => {
	console.log('MongoDB Connected');
});

mongoose.connection.on('error', (err) => {
	console.error('MongoDB Error:', err.message);
});

const connectDB = async () => {
	if (cachedConnection && mongoose.connection.readyState === 1) {
		return cachedConnection;
	}

	if (cachedConnectionPromise) {
		return cachedConnectionPromise;
	}

	const mongoURI = process.env.MONGO_URI;
	if (!mongoURI) {
		throw new Error('MONGO_URI environment variable is not set');
	}

	cachedConnectionPromise = mongoose.connect(mongoURI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverSelectionTimeoutMS: 10000,
		socketTimeoutMS: 45000,
	});

	try {
		await cachedConnectionPromise;
		cachedConnection = mongoose.connection;
		return cachedConnection;
	} catch (error) {
		cachedConnectionPromise = null;
		throw error;
	}
};

module.exports = connectDB;
