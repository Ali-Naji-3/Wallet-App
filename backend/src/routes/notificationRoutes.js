import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/my', requireAuth, getMyNotifications);
router.post('/:id/read', requireAuth, markAsRead);

export default router;


