import express from 'express';
import {
  createBuilding,
  getBuildings,
  getBuildingById,
  updateBuilding,
  deleteBuilding,
} from '../controllers/buildingController.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorize('owner'), createBuilding)
  .get(authorize('owner'), getBuildings);

router.route('/:id')
  .get(getBuildingById)
  .put(authorize('owner'), updateBuilding)
  .delete(authorize('owner'), deleteBuilding);

export default router;
