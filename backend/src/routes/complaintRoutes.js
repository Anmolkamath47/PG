import express from 'express';
import {
  raiseComplaint,
  getComplaints,
  updateComplaintStatus,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorize('tenant'), raiseComplaint)
  .get(getComplaints);

router.put('/:complaintId/status', authorize('owner'), updateComplaintStatus);

export default router;
