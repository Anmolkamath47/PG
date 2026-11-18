import express from 'express';
import {
  getWeeklyMenu,
  updateDayMenu,
  getTodayMenu,
} from '../controllers/menuController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.get('/today', getTodayMenu);
router.get('/weekly/:buildingId?', getWeeklyMenu);
router.put('/day/:buildingId/:dayOfWeek', authorize('owner'), updateDayMenu);

export default router;
