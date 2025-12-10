import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  submitKYC,
  getMyKYCStatus,
  getMyKYCHistory,
  listKYC,
  getStats,
  getKYC,
  getUserKYC,
  startReview,
  approve,
  reject,
} from '../controllers/kycController.js';

const router = express.Router();

// ==================
// USER ROUTES
// ==================

// Submit new KYC verification
router.post('/submit', requireAuth, submitKYC);

// Get current user's KYC status
router.get('/my-status', requireAuth, getMyKYCStatus);

// Get current user's KYC history
router.get('/my-history', requireAuth, getMyKYCHistory);

// ==================
// ADMIN ROUTES
// ==================

// List all KYC verifications
router.get('/admin/list', requireAuth, requireAdmin, listKYC);

// Get KYC stats
router.get('/admin/stats', requireAuth, requireAdmin, getStats);

// Get single KYC verification
router.get('/admin/:id', requireAuth, requireAdmin, getKYC);

// Get user's KYC (for user detail page)
router.get('/admin/user/:userId', requireAuth, requireAdmin, getUserKYC);

// Start review (mark as under_review)
router.post('/admin/:id/start-review', requireAuth, requireAdmin, startReview);

// Approve KYC
router.post('/admin/:id/approve', requireAuth, requireAdmin, approve);

// Reject KYC
router.post('/admin/:id/reject', requireAuth, requireAdmin, reject);

export default router;

