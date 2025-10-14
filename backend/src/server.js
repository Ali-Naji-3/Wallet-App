import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';  // Import the connectDB function

dotenv.config();  // Load environment variables from .env

const app = express();

// Connect to MongoDB
connectDB(); // Call the function to connect to MongoDB

// Middleware to parse incoming JSON requests
app.use(express.json());

// Basic route for testing the server
app.get('/', (req, res) => {
  console.log('GET request received at /');
  res.send('Backend is working!');
});

// Test POST route to check if server works
app.post('/test', (req, res) => {
  const { message } = req.body;
  console.log('POST request received with message:', message);
  res.json({ response: `Received: ${message}` });
});

// Set the port (can be dynamic via environment variables)
const PORT = process.env.PORT || 5001;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1); // Exit the process to avoid any further issues
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1); // Exit the process to avoid any further issues
});
