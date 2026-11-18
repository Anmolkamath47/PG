import express from 'express';
import {
  createPaymentSession,
  processPaymentVerification,
  handlePaymentWebhook,
  getPaymentHistory,
  getPaymentReceipt,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

// Webhook endpoint (unprotected, verified via HMAC signature header)
router.post('/webhook', handlePaymentWebhook);

// Protected routes
router.use(protect);

router.post('/create-session', authorize('tenant'), createPaymentSession);
router.post('/verify-process', authorize('tenant'), processPaymentVerification);
router.get('/history', getPaymentHistory);
router.get('/receipt/:id', getPaymentReceipt);

export default router;
