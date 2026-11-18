import express from 'express';
import { getOwnerOverviewStats } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);
router.use(authorize('owner'));

router.get('/overview', getOwnerOverviewStats);

export default router;
