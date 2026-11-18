import express from 'express';
import {
  getMyMealQRs,
  scanMealQR,
  recordManualAttendance,
  searchTenantsForAttendance,
} from '../controllers/qrController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

// Tenant endpoint to view their 3 meal QRs
router.get('/my-qrs', authorize('tenant'), getMyMealQRs);

// Owner endpoints
router.post('/scan', authorize('owner'), scanMealQR);
router.post('/manual-attendance', authorize('owner'), recordManualAttendance);
router.get('/search-tenants', authorize('owner'), searchTenantsForAttendance);

export default router;
