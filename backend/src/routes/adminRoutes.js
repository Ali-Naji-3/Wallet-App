import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  listUsers,
  getUserDetails,
  freezeUser,
  unfreezeUser,
  listAllTransactions,
  getAdminStats,
  promoteToAdmin,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', getAdminStats);

// User management
router.get('/users', listUsers);
router.get('/users/:id', getUserDetails);
router.post('/users/:id/freeze', freezeUser);
router.post('/users/:id/unfreeze', unfreezeUser);
router.post('/users/:id/promote', promoteToAdmin);

// Transaction monitoring
router.get('/transactions', listAllTransactions);

export default router;

