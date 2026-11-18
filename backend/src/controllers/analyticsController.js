import { Building } from '../models/Building.js';
import { Floor } from '../models/Floor.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { RentInvoice } from '../models/RentInvoice.js';
import { Payment } from '../models/Payment.js';
import { MealAttendance } from '../models/MealAttendance.js';
import { Complaint } from '../models/Complaint.js';
import { AuditLog } from '../models/AuditLog.js';
import { getTodayIST } from '../utils/dateUtils.js';

export const getOwnerOverviewStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const { buildingId } = req.query;

    const buildingFilter = buildingId ? { _id: buildingId, owner: ownerId, isActive: true } : { owner: ownerId, isActive: true };
    const buildings = await Building.find(buildingFilter);
    const buildingIds = buildings.map(b => b._id);

    const totalBuildings = buildings.length;
    const totalFloors = await Floor.countDocuments({ building: { $in: buildingIds } });
    const totalRooms = await Room.countDocuments({ building: { $in: buildingIds } });
    const totalBeds = await Bed.countDocuments({ building: { $in: buildingIds } });
    const occupiedBeds = await Bed.countDocuments({ building: { $in: buildingIds }, status: 'occupied' });
    const availableBeds = await Bed.countDocuments({ building: { $in: buildingIds }, status: 'available' });
    const maintenanceBeds = await Bed.countDocuments({ building: { $in: buildingIds }, status: 'maintenance' });

    const totalActiveTenants = await BedAllocation.countDocuments({
      owner: ownerId,
      building: { $in: buildingIds },
      status: 'active',
    });

    // Rent stats for current month
    const currentMonth = getTodayIST().slice(0, 7); // 'YYYY-MM'
    const invoices = await RentInvoice.find({
      owner: ownerId,
      building: { $in: buildingIds },
      billingMonth: currentMonth,
    });

    const expectedRent = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const collectedRent = invoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const pendingRent = Math.max(0, expectedRent - collectedRent);

    // Pending complaints
    const pendingComplaints = await Complaint.countDocuments({
      building: { $in: buildingIds },
      status: { $in: ['pending', 'in_progress'] },
    });

    // Today's food attendance count
    const today = getTodayIST();
    const todayAttendanceCount = await MealAttendance.countDocuments({
      building: { $in: buildingIds },
      date: today,
    });

    // Monthly Rent Collection Chart (Past 6 months)
    const monthlyRentTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mStr = d.toISOString().slice(0, 7);
      const monthInvoices = await RentInvoice.find({
        owner: ownerId,
        building: { $in: buildingIds },
        billingMonth: mStr,
      });

      const exp = monthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const col = monthInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

      monthlyRentTrends.push({
        month: mStr,
        expected: exp,
        collected: col,
        pending: Math.max(0, exp - col),
      });
    }

    // Daily Food Attendance Trends (Past 7 days)
    const dailyAttendanceTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istTime = new Date(d.getTime() + istOffset);
      const dateStr = istTime.toISOString().split('T')[0];

      const breakfast = await MealAttendance.countDocuments({
        building: { $in: buildingIds },
        date: dateStr,
        mealType: 'breakfast',
      });
      const lunch = await MealAttendance.countDocuments({
        building: { $in: buildingIds },
        date: dateStr,
        mealType: 'lunch',
      });
      const dinner = await MealAttendance.countDocuments({
        building: { $in: buildingIds },
        date: dateStr,
        mealType: 'dinner',
      });

      dailyAttendanceTrends.push({
        date: dateStr.slice(5), // 'MM-DD'
        fullDate: dateStr,
        breakfast,
        lunch,
        dinner,
        total: breakfast + lunch + dinner,
      });
    }

    // Complaint status distribution
    const complaintStats = {
      pending: await Complaint.countDocuments({ building: { $in: buildingIds }, status: 'pending' }),
      inProgress: await Complaint.countDocuments({ building: { $in: buildingIds }, status: 'in_progress' }),
      resolved: await Complaint.countDocuments({ building: { $in: buildingIds }, status: 'resolved' }),
      rejected: await Complaint.countDocuments({ building: { $in: buildingIds }, status: 'rejected' }),
    };

    // Recent activity feed
    const recentLogs = await AuditLog.find({
      $or: [
        { actor: ownerId },
        { details: { $exists: true } }
      ]
    })
      .populate('actor', 'name role')
      .sort('-createdAt')
      .limit(10);

    const formattedActivities = recentLogs.map(l => ({
      id: l._id,
      action: l.action,
      entityType: l.entityType,
      actorName: l.actor?.name || 'System',
      details: l.details,
      timestamp: l.createdAt,
    }));

    res.status(200).json({
      success: true,
      currentMonth,
      summary: {
        totalBuildings,
        totalFloors,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        totalActiveTenants,
        expectedRent,
        collectedRent,
        pendingRent,
        collectionRate: expectedRent > 0 ? Math.round((collectedRent / expectedRent) * 100) : 0,
        pendingComplaints,
        todayAttendanceCount,
      },
      charts: {
        monthlyRentTrends,
        dailyAttendanceTrends,
        complaintStats,
      },
      recentActivities: formattedActivities,
    });
  } catch (error) {
    next(error);
  }
};
