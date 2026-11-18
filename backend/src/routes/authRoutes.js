import express from 'express';
import {
  registerOwner,
  registerTenant,
  login,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register/owner', registerOwner);
router.post('/register/tenant', registerTenant);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
