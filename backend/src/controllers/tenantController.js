import { User } from '../models/User.js';
import { Tenant } from '../models/Tenant.js';
import { Bed } from '../models/Bed.js';
import { Room } from '../models/Room.js';
import { Building } from '../models/Building.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { RentInvoice } from '../models/RentInvoice.js';
import { Payment } from '../models/Payment.js';
import { MealAttendance } from '../models/MealAttendance.js';
import { Complaint } from '../models/Complaint.js';
import { RentService } from '../services/rentService.js';
import { sendNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { getTodayIST } from '../utils/dateUtils.js';

// Add new tenant with bed allocation
export const addTenant = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password = 'Password@123',
      bedId,
      monthlyRent,
      securityDeposit = 0,
      joiningDate = new Date(),
      rentDueDay = 5,
      emergencyContact,
      occupation,
      companyOrCollege,
      notes,
    } = req.body;

    if (!name || !email || !phone || !bedId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and bed selection are required.',
      });
    }

    // 1. ATOMIC BED CHECK: Ensure bed exists, belongs to owner, and is currently available
    const bed = await Bed.findById(bedId).populate('room').populate('building');
    if (!bed) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    if (bed.building.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this PG building' });
    }

    if (bed.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bed.bedNumber} in room ${bed.room.roomNumber} is currently ${bed.status}. Cannot allocate.`,
      });
    }

    // 2. Check if user already exists
    let user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }],
    });

    if (user) {
      // Check if user already has an active allocation
      const activeAlloc = await BedAllocation.findOne({ tenant: user._id, status: 'active' });
      if (activeAlloc) {
        return res.status(400).json({
          success: false,
          message: 'A tenant with this email or phone is already allocated to a room.',
        });
      }
      user.role = 'tenant';
      user.pgOwnerId = req.user._id;
      user.isActive = true;
      await user.save();
    } else {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        phone,
        password,
        role: 'tenant',
        pgOwnerId: req.user._id,
      });
    }

    // 3. Atomically update Bed to occupied
    const rentAmount = Number(monthlyRent) || bed.monthlyRent;
    const updatedBed = await Bed.findOneAndUpdate(
      { _id: bed._id, status: 'available' },
      {
        $set: {
          status: 'occupied',
          currentTenant: user._id,
          monthlyRent: rentAmount,
        }
      },
      { new: true }
    );

    if (!updatedBed) {
      return res.status(400).json({
        success: false,
        message: 'Bed was just allocated by another operation. Please select another bed.',
      });
    }

    // 4. Create BedAllocation record
    const allocation = await BedAllocation.create({
      tenant: user._id,
      bed: bed._id,
      room: bed.room._id,
      building: bed.building._id,
      owner: req.user._id,
      joiningDate: new Date(joiningDate),
      monthlyRent: rentAmount,
      securityDeposit: Number(securityDeposit),
      rentDueDay: Number(rentDueDay) || 5,
      status: 'active',
      notes: notes || '',
    });

    // Link allocation to bed
    updatedBed.currentAllocation = allocation._id;
    await updatedBed.save();

    // 5. Create or update Tenant record
    let tenantProfile = await Tenant.findOne({ user: user._id });
    if (!tenantProfile) {
      tenantProfile = await Tenant.create({
        user: user._id,
        owner: req.user._id,
        emergencyContact: emergencyContact || {},
        occupation: occupation || 'working_professional',
        companyOrCollege: companyOrCollege || '',
        currentAllocation: allocation._id,
        status: 'active',
      });
    } else {
      tenantProfile.owner = req.user._id;
      tenantProfile.currentAllocation = allocation._id;
      tenantProfile.status = 'active';
      if (emergencyContact) tenantProfile.emergencyContact = emergencyContact;
      if (occupation) tenantProfile.occupation = occupation;
      if (companyOrCollege) tenantProfile.companyOrCollege = companyOrCollege;
      await tenantProfile.save();
    }

    // 6. Generate first month rent invoice automatically
    const currentMonthStr = getTodayIST().slice(0, 7); // 'YYYY-MM'
    await RentService.generateInvoiceForAllocation(allocation, currentMonthStr);

    // 7. Audit log & Notification
    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'TENANT_ALLOCATED',
      entityType: 'BedAllocation',
      entityId: allocation._id,
      details: { tenantName: user.name, roomNumber: bed.room.roomNumber, bedNumber: bed.bedNumber },
      req,
    });

    await sendNotification({
      recipientId: user._id,
      role: 'tenant',
      title: 'Welcome to your new room!',
      message: `You have been allocated Bed ${bed.bedNumber} in Room ${bed.room.roomNumber} at ${bed.building.name}.`,
      type: 'bed',
      relatedEntity: { entityType: 'BedAllocation', entityId: allocation._id },
    });

    res.status(201).json({
      success: true,
      message: 'Tenant added and bed allocated successfully.',
      tenant: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        allocation: {
          id: allocation._id,
          buildingName: bed.building.name,
          roomNumber: bed.room.roomNumber,
          bedNumber: bed.bedNumber,
          monthlyRent: allocation.monthlyRent,
          joiningDate: allocation.joiningDate,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// List all tenants under owner's PGs
export const getTenants = async (req, res, next) => {
  try {
    const { buildingId, status = 'active', search } = req.query;

    const query = { owner: req.user._id };
    if (buildingId) query.building = buildingId;
    if (status) query.status = status;

    const allocations = await BedAllocation.find(query)
      .populate('tenant', 'name email phone avatar isActive createdAt')
      .populate('building', 'name address')
      .populate('room', 'roomNumber roomType baseRent')
      .populate('bed', 'bedNumber monthlyRent status')
      .sort('-createdAt');

    // Filter by search query if present
    let filtered = allocations;
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = allocations.filter(a =>
        a.tenant?.name?.toLowerCase().includes(q) ||
        a.tenant?.phone?.includes(q) ||
        a.tenant?.email?.toLowerCase().includes(q) ||
        a.room?.roomNumber?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      tenants: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// Get single tenant full profile with history
export const getTenantDetails = async (req, res, next) => {
  try {
    const { tenantId } = req.params;

    const user = await User.findById(tenantId);
    if (!user) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const tenantProfile = await Tenant.findOne({ user: tenantId });
    const currentAllocation = await BedAllocation.findOne({ tenant: tenantId, status: 'active' })
      .populate('building')
      .populate('room')
      .populate('bed');

    const allocationHistory = await BedAllocation.find({ tenant: tenantId })
      .populate('building', 'name')
      .populate('room', 'roomNumber')
      .populate('bed', 'bedNumber')
      .sort('-createdAt');

    const paymentHistory = await Payment.find({ tenant: tenantId })
      .populate('rentInvoice', 'invoiceNumber billingMonth')
      .sort('-createdAt')
      .limit(10);

    const invoices = await RentInvoice.find({ tenant: tenantId }).sort('-createdAt').limit(12);

    const recentAttendance = await MealAttendance.find({ tenant: tenantId }).sort('-date').limit(15);

    const complaints = await Complaint.find({ tenant: tenantId }).sort('-createdAt');

    res.status(200).json({
      success: true,
      user,
      tenantProfile,
      currentAllocation,
      allocationHistory,
      invoices,
      paymentHistory,
      recentAttendance,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

// Transfer tenant to another bed
export const transferTenantBed = async (req, res, next) => {
  try {
    const { tenantId, newBedId, newMonthlyRent, reason } = req.body;

    // Find current active allocation
    const currentAllocation = await BedAllocation.findOne({
      tenant: tenantId,
      status: 'active',
      owner: req.user._id,
    });

    if (!currentAllocation) {
      return res.status(404).json({ success: false, message: 'Active allocation for tenant not found' });
    }

    // Verify new bed is available
    const newBed = await Bed.findById(newBedId).populate('room').populate('building');
    if (!newBed) return res.status(404).json({ success: false, message: 'Target bed not found' });

    if (newBed.status !== 'available') {
      return res.status(400).json({ success: false, message: `Target bed is ${newBed.status}. Must be available.` });
    }

    const oldBedId = currentAllocation.bed;

    // 1. Mark old bed available
    await Bed.findByIdAndUpdate(oldBedId, {
      $set: { status: 'available', currentTenant: null, currentAllocation: null }
    });

    // 2. Mark previous allocation as transferred
    currentAllocation.status = 'transferred';
    currentAllocation.checkoutDate = new Date();
    currentAllocation.notes = `${currentAllocation.notes} | Transferred on ${new Date().toISOString()}: ${reason || 'Room change'}`;
    await currentAllocation.save();

    // 3. Create new active BedAllocation
    const rent = Number(newMonthlyRent) || newBed.monthlyRent;
    const newAllocation = await BedAllocation.create({
      tenant: tenantId,
      bed: newBed._id,
      room: newBed.room._id,
      building: newBed.building._id,
      owner: req.user._id,
      joiningDate: new Date(),
      monthlyRent: rent,
      securityDeposit: currentAllocation.securityDeposit,
      rentDueDay: currentAllocation.rentDueDay,
      status: 'active',
      previousBed: oldBedId,
      notes: reason || 'Transferred from previous bed',
    });

    // 4. Update new bed to occupied
    newBed.status = 'occupied';
    newBed.currentTenant = tenantId;
    newBed.currentAllocation = newAllocation._id;
    newBed.monthlyRent = rent;
    await newBed.save();

    // 5. Update tenant profile reference
    await Tenant.findOneAndUpdate({ user: tenantId }, { currentAllocation: newAllocation._id });

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'TENANT_TRANSFERRED',
      entityType: 'BedAllocation',
      entityId: newAllocation._id,
      details: { tenantId, fromBed: oldBedId, toBed: newBed._id, reason },
      req,
    });

    res.status(200).json({
      success: true,
      message: `Tenant transferred to Room ${newBed.room.roomNumber} - Bed ${newBed.bedNumber} successfully.`,
      allocation: newAllocation,
    });
  } catch (error) {
    next(error);
  }
};

// Checkout tenant
export const checkoutTenant = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { checkoutDate = new Date(), refundDeposit = false, notes = '' } = req.body;

    const allocation = await BedAllocation.findOne({
      tenant: tenantId,
      status: 'active',
      owner: req.user._id,
    });

    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Active allocation not found for tenant' });
    }

    // 1. Mark bed available
    await Bed.findByIdAndUpdate(allocation.bed, {
      $set: {
        status: 'available',
        currentTenant: null,
        currentAllocation: null,
      }
    });

    // 2. End allocation record
    allocation.status = 'checked_out';
    allocation.checkoutDate = new Date(checkoutDate);
    allocation.depositRefunded = Boolean(refundDeposit);
    allocation.notes = `${allocation.notes} | Checked out: ${notes}`;
    await allocation.save();

    // 3. Update tenant profile status
    await Tenant.findOneAndUpdate(
      { user: tenantId },
      { status: 'checked_out', currentAllocation: null }
    );

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'TENANT_CHECKED_OUT',
      entityType: 'BedAllocation',
      entityId: allocation._id,
      details: { tenantId, checkoutDate, refundDeposit },
      req,
    });

    await sendNotification({
      recipientId: tenantId,
      role: 'tenant',
      title: 'Checkout Confirmation',
      message: 'Your checkout from the PG has been processed. We wish you the very best!',
      type: 'general',
    });

    res.status(200).json({
      success: true,
      message: 'Tenant checked out successfully. Bed is now available.',
      allocation,
    });
  } catch (error) {
    next(error);
  }
};
