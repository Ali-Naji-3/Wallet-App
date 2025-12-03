import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { exchange, transfer, listMyTransactions } from '../controllers/transactionController.js';

const router = express.Router();

router.post('/exchange', requireAuth, exchange);
router.post('/transfer', requireAuth, transfer);
router.get('/my', requireAuth, listMyTransactions);

export default router;


