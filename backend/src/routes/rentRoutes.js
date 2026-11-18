import express from 'express';
import {
  getRentDashboard,
  generateMonthlyInvoices,
  recordManualPayment,
  sendRentReminder,
  getMyInvoices,
} from '../controllers/rentController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Tenant view
router.get('/my-invoices', authorize('tenant'), getMyInvoices);

// Owner views & actions
router.get('/dashboard', authorize('owner'), getRentDashboard);
router.post('/generate-monthly', authorize('owner'), generateMonthlyInvoices);
router.post('/manual-payment', authorize('owner'), recordManualPayment);
router.post('/remind/:invoiceId', authorize('owner'), sendRentReminder);

export default router;
