import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getPortfolioSummary,
  getRecentActivity,
  getPLChartData,
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.get('/portfolio', requireAuth, getPortfolioSummary);
router.get('/activity', requireAuth, getRecentActivity);
router.get('/pl-chart', requireAuth, getPLChartData);

export default router;

