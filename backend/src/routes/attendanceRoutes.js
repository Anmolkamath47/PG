import express from 'express';
import {
  getAttendanceReport,
  exportAttendanceCSV,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);
router.use(authorize('owner'));

router.get('/report', getAttendanceReport);
router.get('/export-csv', exportAttendanceCSV);

export default router;
