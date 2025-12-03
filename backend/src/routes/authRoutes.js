import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfileHandler,
  changePassword,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

router.get('/me', requireAuth, getProfile);
router.put('/me', requireAuth, updateProfileHandler);
router.post('/change-password', requireAuth, changePassword);

export default router;


