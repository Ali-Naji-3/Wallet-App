import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getCurrencies, getMyWallets, getLatestFxRates } from '../controllers/walletController.js';

const router = express.Router();

router.get('/currencies', requireAuth, getCurrencies);
router.get('/my', requireAuth, getMyWallets);
router.get('/fx/latest', requireAuth, getLatestFxRates);

export default router;


