import { MealAttendance } from '../models/MealAttendance.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Building } from '../models/Building.js';
import { Room } from '../models/Room.js';
import { getTodayIST } from '../utils/dateUtils.js';

export const getAttendanceReport = async (req, res, next) => {
  try {
    const { buildingId, date = getTodayIST(), floorId, roomId, mealType } = req.query;

    if (!buildingId) {
      return res.status(400).json({ success: false, message: 'Building ID is required' });
    }

    // Verify building belongs to owner
    const building = await Building.findOne({ _id: buildingId, owner: req.user._id });
    if (!building) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to PG building' });
    }

    // Find all active bed allocations in this building
    const allocationQuery = { building: buildingId, status: 'active' };
    if (roomId) allocationQuery.room = roomId;

    const allocations = await BedAllocation.find(allocationQuery)
      .populate('tenant', 'name email phone avatar')
      .populate('room', 'roomNumber floor')
      .populate('bed', 'bedNumber');

    // Filter by floor if specified
    let filteredAllocations = allocations;
    if (floorId) {
      filteredAllocations = allocations.filter(
        a => a.room?.floor?.toString() === floorId.toString()
      );
    }

    // Fetch all attendance records for this building on this date
    const attendanceQuery = { building: buildingId, date };
    if (mealType) attendanceQuery.mealType = mealType;

    const attendanceRecords = await MealAttendance.find(attendanceQuery)
      .populate('scannedBy', 'name role');

    // Build tabular matrix: for each tenant, check breakfast, lunch, dinner
    const matrix = filteredAllocations.map(a => {
      const tenantId = a.tenant?._id?.toString();
      const bRecord = attendanceRecords.find(
        r => r.tenant.toString() === tenantId && r.mealType === 'breakfast'
      );
      const lRecord = attendanceRecords.find(
        r => r.tenant.toString() === tenantId && r.mealType === 'lunch'
      );
      const dRecord = attendanceRecords.find(
        r => r.tenant.toString() === tenantId && r.mealType === 'dinner'
      );

      return {
        tenant: a.tenant,
        roomNumber: a.room?.roomNumber || 'N/A',
        bedNumber: a.bed?.bedNumber || 'N/A',
        date,
        breakfast: bRecord
          ? { status: 'Recorded', scanTime: bRecord.scanTime, method: bRecord.verificationMethod }
          : { status: 'Not recorded' },
        lunch: lRecord
          ? { status: 'Recorded', scanTime: lRecord.scanTime, method: lRecord.verificationMethod }
          : { status: 'Not recorded' },
        dinner: dRecord
          ? { status: 'Recorded', scanTime: dRecord.scanTime, method: dRecord.verificationMethod }
          : { status: 'Not recorded' },
      };
    });

    const totalActiveTenants = filteredAllocations.length;
    const breakfastCount = attendanceRecords.filter(r => r.mealType === 'breakfast').length;
    const lunchCount = attendanceRecords.filter(r => r.mealType === 'lunch').length;
    const dinnerCount = attendanceRecords.filter(r => r.mealType === 'dinner').length;

    res.status(200).json({
      success: true,
      date,
      totalActiveTenants,
      stats: {
        totalMealsServed: breakfastCount + lunchCount + dinnerCount,
        breakfast: { count: breakfastCount, percentage: totalActiveTenants ? Math.round((breakfastCount / totalActiveTenants) * 100) : 0 },
        lunch: { count: lunchCount, percentage: totalActiveTenants ? Math.round((lunchCount / totalActiveTenants) * 100) : 0 },
        dinner: { count: dinnerCount, percentage: totalActiveTenants ? Math.round((dinnerCount / totalActiveTenants) * 100) : 0 },
      },
      records: matrix,
    });
  } catch (error) {
    next(error);
  }
};

// Export attendance report as CSV
export const exportAttendanceCSV = async (req, res, next) => {
  try {
    const { buildingId, date = getTodayIST() } = req.query;

    const building = await Building.findOne({ _id: buildingId, owner: req.user._id });
    if (!building) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const allocations = await BedAllocation.find({ building: buildingId, status: 'active' })
      .populate('tenant', 'name email phone')
      .populate('room', 'roomNumber')
      .populate('bed', 'bedNumber');

    const attendanceRecords = await MealAttendance.find({ building: buildingId, date });

    let csv = 'Tenant Name,Phone,Room,Bed,Date,Breakfast,Lunch,Dinner\n';
    allocations.forEach(a => {
      const tid = a.tenant?._id?.toString();
      const b = attendanceRecords.some(r => r.tenant.toString() === tid && r.mealType === 'breakfast') ? 'Recorded' : 'Not recorded';
      const l = attendanceRecords.some(r => r.tenant.toString() === tid && r.mealType === 'lunch') ? 'Recorded' : 'Not recorded';
      const d = attendanceRecords.some(r => r.tenant.toString() === tid && r.mealType === 'dinner') ? 'Recorded' : 'Not recorded';

      csv += `"${a.tenant?.name || ''}","${a.tenant?.phone || ''}","${a.room?.roomNumber || ''}","${a.bed?.bedNumber || ''}","${date}","${b}","${l}","${d}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${date}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
