import express from 'express';
import {
  addTenant,
  getTenants,
  getTenantDetails,
  transferTenantBed,
  checkoutTenant,
} from '../controllers/tenantController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.post('/add', authorize('owner'), addTenant);
router.get('/', authorize('owner'), getTenants);
router.get('/:tenantId', getTenantDetails);
router.post('/transfer', authorize('owner'), transferTenantBed);
router.post('/:tenantId/checkout', authorize('owner'), checkoutTenant);

export default router;
