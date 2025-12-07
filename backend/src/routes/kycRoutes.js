import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
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
router.post('/submit', protect, submitKYC);

// Get current user's KYC status
router.get('/my-status', protect, getMyKYCStatus);

// Get current user's KYC history
router.get('/my-history', protect, getMyKYCHistory);

// ==================
// ADMIN ROUTES
// ==================

// List all KYC verifications
router.get('/admin/list', protect, adminOnly, listKYC);

// Get KYC stats
router.get('/admin/stats', protect, adminOnly, getStats);

// Get single KYC verification
router.get('/admin/:id', protect, adminOnly, getKYC);

// Get user's KYC (for user detail page)
router.get('/admin/user/:userId', protect, adminOnly, getUserKYC);

// Start review (mark as under_review)
router.post('/admin/:id/start-review', protect, adminOnly, startReview);

// Approve KYC
router.post('/admin/:id/approve', protect, adminOnly, approve);

// Reject KYC
router.post('/admin/:id/reject', protect, adminOnly, reject);

export default router;

