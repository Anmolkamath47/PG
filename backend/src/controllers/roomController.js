import { Building } from '../models/Building.js';
import { Floor } from '../models/Floor.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { logAudit } from '../services/auditService.js';

// Get visual building layout for room and bed management
export const getBuildingLayout = async (req, res, next) => {
  try {
    const { buildingId } = req.params;

    // Verify building belongs to owner
    const building = await Building.findOne({
      _id: buildingId,
      owner: req.user._id,
    });

    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    const floors = await Floor.find({ building: buildingId }).sort('floorNumber');
    const rooms = await Room.find({ building: buildingId }).sort('roomNumber');
    const beds = await Bed.find({ building: buildingId })
      .populate('currentTenant', 'name email phone avatar')
      .populate({
        path: 'currentAllocation',
        select: 'joiningDate monthlyRent securityDeposit rentDueDay'
      });

    // Structure layout by floor -> room -> beds
    const layout = floors.map((fl) => {
      const floorRooms = rooms.filter((r) => r.floor.toString() === fl._id.toString());
      
      const structuredRooms = floorRooms.map((rm) => {
        const roomBeds = beds.filter((b) => b.room.toString() === rm._id.toString());
        return {
          ...rm.toObject(),
          beds: roomBeds,
          totalBeds: roomBeds.length,
          availableBeds: roomBeds.filter((b) => b.status === 'available').length,
          occupiedBeds: roomBeds.filter((b) => b.status === 'occupied').length,
          maintenanceBeds: roomBeds.filter((b) => b.status === 'maintenance').length,
        };
      });

      return {
        ...fl.toObject(),
        rooms: structuredRooms,
        totalRooms: structuredRooms.length,
      };
    });

    res.status(200).json({
      success: true,
      building: {
        id: building._id,
        name: building.name,
        address: building.address,
        totalFloors: building.totalFloors,
      },
      layout,
    });
  } catch (error) {
    next(error);
  }
};

// Add Floor
export const addFloor = async (req, res, next) => {
  try {
    const { buildingId, floorNumber, name, description } = req.body;

    const building = await Building.findOne({ _id: buildingId, owner: req.user._id });
    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    const existing = await Floor.findOne({ building: buildingId, floorNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Floor ${floorNumber} already exists` });
    }

    const floor = await Floor.create({
      building: buildingId,
      floorNumber,
      name: name || `Floor ${floorNumber}`,
      description: description || '',
    });

    res.status(201).json({ success: true, message: 'Floor added successfully', floor });
  } catch (error) {
    next(error);
  }
};

// Add Room with automatic or custom beds
export const addRoom = async (req, res, next) => {
  try {
    const {
      buildingId,
      floorId,
      roomNumber,
      roomType = 'double',
      capacity = 2,
      baseRent = 8500,
      attachedBathroom = true,
      acAvailable = false,
      hasBalcony = false,
      bedLabels = [], // e.g., ['Bed A', 'Bed B']
    } = req.body;

    // Verify building ownership
    const building = await Building.findOne({ _id: buildingId, owner: req.user._id });
    if (!building) {
      return res.status(404).json({ success: false, message: 'Building not found' });
    }

    // Check duplicate room number in building
    const existingRoom = await Room.findOne({ building: buildingId, roomNumber: roomNumber.trim() });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room ${roomNumber} already exists in this building.`,
      });
    }

    const room = await Room.create({
      building: buildingId,
      floor: floorId,
      roomNumber: roomNumber.trim(),
      roomType,
      capacity: Number(capacity),
      baseRent: Number(baseRent),
      attachedBathroom,
      acAvailable,
      hasBalcony,
      status: 'active',
    });

    // Automatically create beds for the room according to capacity
    const bedsToCreate = [];
    const defaultLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < capacity; i++) {
      const label = bedLabels[i] || `Bed ${defaultLabels[i] || i + 1}`;
      bedsToCreate.push({
        building: buildingId,
        floor: floorId,
        room: room._id,
        bedNumber: label,
        monthlyRent: Number(baseRent),
        status: 'available',
      });
    }

    const createdBeds = await Bed.insertMany(bedsToCreate);

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'ROOM_CREATED',
      entityType: 'Room',
      entityId: room._id,
      details: { roomNumber, capacity, baseRent },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Room ${roomNumber} created with ${createdBeds.length} beds.`,
      room,
      beds: createdBeds,
    });
  } catch (error) {
    next(error);
  }
};

// Add individual bed to a room
export const addBed = async (req, res, next) => {
  try {
    const { roomId, bedNumber, monthlyRent } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    // Verify building owner
    const building = await Building.findOne({ _id: room.building, owner: req.user._id });
    if (!building) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const existingBed = await Bed.findOne({ room: roomId, bedNumber: bedNumber.trim() });
    if (existingBed) {
      return res.status(400).json({ success: false, message: `Bed ${bedNumber} already exists in this room` });
    }

    const bed = await Bed.create({
      building: room.building,
      floor: room.floor,
      room: room._id,
      bedNumber: bedNumber.trim(),
      monthlyRent: Number(monthlyRent) || room.baseRent,
      status: 'available',
    });

    // Update room capacity count
    room.capacity = (await Bed.countDocuments({ room: roomId }));
    await room.save();

    res.status(201).json({ success: true, message: 'Bed added successfully', bed });
  } catch (error) {
    next(error);
  }
};

// Update Bed Status (Available, Maintenance, Inactive)
export const updateBedStatus = async (req, res, next) => {
  try {
    const { bedId } = req.params;
    const { status, maintenanceReason, monthlyRent } = req.body;

    const bed = await Bed.findById(bedId).populate('room');
    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found' });

    const building = await Building.findOne({ _id: bed.building, owner: req.user._id });
    if (!building) return res.status(403).json({ success: false, message: 'Unauthorized' });

    if (bed.status === 'occupied' && status !== 'occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually change status of an occupied bed. Please checkout or transfer the tenant first.',
      });
    }

    if (status) bed.status = status;
    if (maintenanceReason !== undefined) bed.maintenanceReason = maintenanceReason;
    if (monthlyRent) bed.monthlyRent = Number(monthlyRent);

    await bed.save();

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'BED_STATUS_UPDATED',
      entityType: 'Bed',
      entityId: bed._id,
      details: { status, maintenanceReason },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Bed ${bed.bedNumber} status updated to ${bed.status}`,
      bed,
    });
  } catch (error) {
    next(error);
  }
};

// Delete empty room
export const deleteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    const building = await Building.findOne({ _id: room.building, owner: req.user._id });
    if (!building) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const occupiedBeds = await Bed.countDocuments({ room: roomId, status: 'occupied' });
    if (occupiedBeds > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete room with ${occupiedBeds} occupied beds. Please checkout tenants first.`,
      });
    }

    // Delete beds of this room
    await Bed.deleteMany({ room: roomId });
    await Room.findByIdAndDelete(roomId);

    res.status(200).json({ success: true, message: 'Room and its empty beds deleted successfully' });
  } catch (error) {
    next(error);
  }
};
