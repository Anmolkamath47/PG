import express from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createAnnouncement,
  getAnnouncements,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

router.post('/announcements', authorize('owner'), createAnnouncement);
router.get('/announcements', getAnnouncements);

export default router;
