import { QRService } from '../services/qrService.js';
import { MealAttendance } from '../models/MealAttendance.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Building } from '../models/Building.js';
import { User } from '../models/User.js';
import { getTodayIST, getCurrentMealType } from '../utils/dateUtils.js';

// Get today's 3 meal QRs for the logged-in tenant
export const getMyMealQRs = async (req, res, next) => {
  try {
    const tenantId = req.user._id;
    const today = getTodayIST();
    const currentMeal = getCurrentMealType();

    // Verify active allocation
    const allocation = await BedAllocation.findOne({
      tenant: tenantId,
      status: 'active',
    }).populate('building', 'name mealTimings address');

    if (!allocation) {
      return res.status(400).json({
        success: false,
        message: 'No active PG bed allocation found. Please contact your PG manager.',
      });
    }

    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    const results = {};

    for (const meal of mealTypes) {
      try {
        const qrData = await QRService.getOrCreateMealQR(tenantId, meal, today);
        results[meal] = {
          ...qrData,
          timing: allocation.building?.mealTimings?.[meal] || '',
          isCurrentActive: meal === currentMeal,
        };
      } catch (err) {
        results[meal] = {
          status: 'error',
          message: err.message,
          mealType: meal,
        };
      }
    }

    res.status(200).json({
      success: true,
      today,
      currentMeal,
      building: {
        id: allocation.building._id,
        name: allocation.building.name,
      },
      meals: results,
    });
  } catch (error) {
    next(error);
  }
};

// Owner scans QR code
export const scanMealQR = async (req, res, next) => {
  try {
    const { token, buildingId } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'QR code token string is required.',
      });
    }

    const result = await QRService.verifyAndConsumeQR({
      tokenString: token,
      scannerOwnerId: req.user._id,
      targetBuildingId: buildingId,
      verificationMethod: 'qr_scan',
      req,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Manual fallback attendance recording
export const recordManualAttendance = async (req, res, next) => {
  try {
    const { tenantId, buildingId, mealType, date, notes } = req.body;

    if (!tenantId || !buildingId || !mealType) {
      return res.status(400).json({
        success: false,
        message: 'Tenant, building, and meal type are required.',
      });
    }

    // Verify building belongs to owner
    const building = await Building.findOne({ _id: buildingId, owner: req.user._id });
    if (!building) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to PG building' });
    }

    const result = await QRService.recordManualAttendance({
      tenantId,
      buildingId,
      mealType,
      date: date || getTodayIST(),
      scannerOwnerId: req.user._id,
      notes: notes || 'Manual verification by manager',
      req,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Search tenants for manual fallback check-in
export const searchTenantsForAttendance = async (req, res, next) => {
  try {
    const { buildingId, query } = req.query;

    if (!buildingId) {
      return res.status(400).json({ success: false, message: 'Building ID is required' });
    }

    const allocations = await BedAllocation.find({
      building: buildingId,
      status: 'active',
      owner: req.user._id,
    })
      .populate('tenant', 'name email phone avatar')
      .populate('room', 'roomNumber')
      .populate('bed', 'bedNumber');

    let matched = allocations;
    if (query && query.trim() !== '') {
      const q = query.trim().toLowerCase();
      matched = allocations.filter(
        a =>
          a.tenant?.name?.toLowerCase().includes(q) ||
          a.tenant?.phone?.includes(q) ||
          a.room?.roomNumber?.toLowerCase().includes(q)
      );
    }

    const today = getTodayIST();
    const currentMeal = getCurrentMealType();

    // Attach today's attendance status for each tenant
    const results = await Promise.all(
      matched.slice(0, 20).map(async a => {
        const attendance = await MealAttendance.findOne({
          tenant: a.tenant._id,
          date: today,
          mealType: currentMeal,
        });

        return {
          allocationId: a._id,
          tenant: a.tenant,
          roomNumber: a.room?.roomNumber,
          bedNumber: a.bed?.bedNumber,
          hasAttendedCurrentMeal: Boolean(attendance),
          attendanceRecord: attendance,
        };
      })
    );

    res.status(200).json({
      success: true,
      currentMeal,
      today,
      tenants: results,
    });
  } catch (error) {
    next(error);
  }
};
