import express from 'express';
import {
  getBuildingLayout,
  addFloor,
  addRoom,
  addBed,
  updateBedStatus,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);
router.use(authorize('owner'));

router.get('/layout/:buildingId', getBuildingLayout);
router.post('/floor', addFloor);
router.post('/room', addRoom);
router.post('/bed', addBed);
router.put('/bed/:bedId/status', updateBedStatus);
router.delete('/room/:roomId', deleteRoom);

export default router;
