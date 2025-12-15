import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB, closeDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import { initAuth } from './controllers/authController.js';
import { initTransactions } from './controllers/transactionController.js';
import { initKYC } from './controllers/kycController.js';

dotenv.config();

const app = express();
let server;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.send('FXWallet backend is running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/kyc', kycRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  await initAuth();
  await initTransactions();
  await initKYC();

  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed');
      
      // Close database connections
      await closeDB();
      
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Forcing shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    // If server wasn't started yet, just close DB
    await closeDB();
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('uncaughtException', async (err) => {
  console.error('Uncaught Exception:', err);
  await closeDB();
  process.exit(1);
});

process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Rejection:', err);
  await closeDB();
  process.exit(1);
});
