import { Building } from '../models/Building.js';
import { Floor } from '../models/Floor.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Menu } from '../models/Menu.js';
import { logAudit } from '../services/auditService.js';

export const createBuilding = async (req, res, next) => {
  try {
    const {
      name,
      address,
      contactNumber,
      totalFloors = 1,
      description = '',
      amenities = [],
      rules = [],
      genderAllowed = 'co-living',
      mealTimings,
    } = req.body;

    if (!name || !address || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Building name, address, and contact number are required.',
      });
    }

    const building = await Building.create({
      owner: req.user._id,
      name,
      address,
      contactNumber,
      totalFloors,
      description,
      amenities,
      rules,
      genderAllowed,
      mealTimings: mealTimings || {
        breakfast: '07:30 - 09:30',
        lunch: '12:30 - 14:30',
        dinner: '19:30 - 21:30',
      },
    });

    // Auto-create initial floors
    const floorsToCreate = [];
    for (let f = 1; f <= totalFloors; f++) {
      floorsToCreate.push({
        building: building._id,
        floorNumber: f,
        name: f === 1 ? '1st Floor (Ground)' : `${f}${f === 2 ? 'nd' : f === 3 ? 'rd' : 'th'} Floor`,
      });
    }
    await Floor.insertMany(floorsToCreate);

    // Initialize default weekly menus for this building
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const menus = days.map(day => ({
      owner: req.user._id,
      building: building._id,
      dayOfWeek: day,
      breakfast: { items: '', timing: '07:30 - 09:30' },
      lunch: { items: '', timing: '12:30 - 14:30' },
      dinner: { items: '', timing: '19:30 - 21:30' },
      isPublished: true,
    }));
    await Menu.insertMany(menus);

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'BUILDING_CREATED',
      entityType: 'Building',
      entityId: building._id,
      details: { name, totalFloors },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Building created successfully with floors and initial food menus.',
      building,
    });
  } catch (error) {
    next(error);
  }
};

export const getBuildings = async (req, res, next) => {
  try {
    const buildings = await Building.find({ owner: req.user._id, isActive: true }).sort('-createdAt');

    // Attach stats for each building (rooms, beds, occupied beds)
    const buildingsWithStats = await Promise.all(
      buildings.map(async (b) => {
        const roomCount = await Room.countDocuments({ building: b._id });
        const bedCount = await Bed.countDocuments({ building: b._id });
        const occupiedCount = await Bed.countDocuments({ building: b._id, status: 'occupied' });
        const availableCount = await Bed.countDocuments({ building: b._id, status: 'available' });

        return {
          ...b.toObject(),
          stats: {
            roomCount,
            bedCount,
            occupiedCount,
            availableCount,
            occupancyRate: bedCount > 0 ? Math.round((occupiedCount / bedCount) * 100) : 0,
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: buildingsWithStats.length,
      buildings: buildingsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getBuildingById = async (req, res, next) => {
  try {
    const building = await Building.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    const floors = await Floor.find({ building: building._id }).sort('floorNumber');
    const rooms = await Room.find({ building: building._id }).sort('roomNumber');
    const beds = await Bed.find({ building: building._id });

    res.status(200).json({
      success: true,
      building,
      floors,
      roomsCount: rooms.length,
      bedsCount: beds.length,
      occupiedBeds: beds.filter(b => b.status === 'occupied').length,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBuilding = async (req, res, next) => {
  try {
    const building = await Building.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    const updated = await Building.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'BUILDING_UPDATED',
      entityType: 'Building',
      entityId: building._id,
      details: req.body,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      building: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBuilding = async (req, res, next) => {
  try {
    const building = await Building.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    // Check if there are active allocations in this building
    const activeAllocations = await BedAllocation.countDocuments({
      building: building._id,
      status: 'active',
    });

    if (activeAllocations > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete building. There are currently ${activeAllocations} active tenant allocations. Please checkout or transfer tenants first.`,
      });
    }

    // Soft delete or deactivate
    building.isActive = false;
    await building.save();

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'BUILDING_DEACTIVATED',
      entityType: 'Building',
      entityId: building._id,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Building removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};
