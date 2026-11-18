import { Complaint } from '../models/Complaint.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { sendNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';

// Tenant raises a complaint
export const raiseComplaint = async (req, res, next) => {
  try {
    const { category, title, description, priority = 'medium', images = [] } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Category, title, and description are required.',
      });
    }

    // Get tenant's active allocation to bind building & room
    const allocation = await BedAllocation.findOne({
      tenant: req.user._id,
      status: 'active',
    }).populate('building').populate('room');

    if (!allocation) {
      return res.status(400).json({
        success: false,
        message: 'You do not have an active PG room allocation to raise complaints for.',
      });
    }

    const complaintCount = await Complaint.countDocuments();
    const complaintNumber = `CMP-${String(complaintCount + 1).padStart(4, '0')}`;

    const complaint = await Complaint.create({
      complaintNumber,
      tenant: req.user._id,
      building: allocation.building._id,
      room: allocation.room._id,
      category,
      title: title.trim(),
      description: description.trim(),
      priority,
      images,
      status: 'pending',
    });

    // Notify owner
    await sendNotification({
      recipientId: allocation.building.owner,
      role: 'owner',
      title: `New Complaint: ${title}`,
      message: `${req.user.name} (Room ${allocation.room.roomNumber}) reported a [${category.toUpperCase()}] issue.`,
      type: 'complaint',
      relatedEntity: { entityType: 'Complaint', entityId: complaint._id },
    });

    await logAudit({
      actor: req.user._id,
      actorRole: 'tenant',
      action: 'COMPLAINT_SUBMITTED',
      entityType: 'Complaint',
      entityId: complaint._id,
      details: { category, title, roomNumber: allocation.room.roomNumber },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. Your PG manager has been alerted.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

// Get complaints (role-based)
export const getComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, buildingId, search } = req.query;

    let query = {};
    if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    } else {
      // Owner: filter by buildings owned by this owner
      if (buildingId) {
        query.building = buildingId;
      }
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const complaints = await Complaint.find(query)
      .populate('tenant', 'name email phone avatar')
      .populate('building', 'name address')
      .populate('room', 'roomNumber roomType')
      .sort('-createdAt');

    let filtered = complaints;
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = complaints.filter(
        c =>
          c.complaintNumber?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q) ||
          c.tenant?.name?.toLowerCase().includes(q) ||
          c.room?.roomNumber?.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      complaints: filtered,
    });
  } catch (error) {
    next(error);
  }
};

// Owner updates complaint status, responds, or assigns staff
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { complaintId } = req.params;
    const { status, ownerResponse, assignedTo, priority } = req.body;

    const complaint = await Complaint.findById(complaintId)
      .populate('tenant', 'name email phone')
      .populate('building');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    if (status) complaint.status = status;
    if (ownerResponse !== undefined) complaint.ownerResponse = ownerResponse;
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (priority) complaint.priority = priority;

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Notify tenant of status change
    await sendNotification({
      recipientId: complaint.tenant._id,
      role: 'tenant',
      title: `Complaint Status: ${complaint.status.replace('_', ' ').toUpperCase()}`,
      message: `Your complaint "${complaint.title}" has been updated to "${complaint.status}". ${ownerResponse ? `Manager Note: "${ownerResponse}"` : ''}`,
      type: 'complaint',
      relatedEntity: { entityType: 'Complaint', entityId: complaint._id },
    });

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'COMPLAINT_STATUS_UPDATED',
      entityType: 'Complaint',
      entityId: complaint._id,
      details: { status, ownerResponse },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Complaint updated successfully.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};
