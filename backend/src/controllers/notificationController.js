import { Notification } from '../models/Notification.js';
import { Announcement } from '../models/Announcement.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { sendNotification } from '../services/notificationService.js';

// Get user notifications
export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
export const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Owner creates an announcement
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, buildingId, priority = 'normal', expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const announcement = await Announcement.create({
      owner: req.user._id,
      building: buildingId || null,
      title: title.trim(),
      message: message.trim(),
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Notify relevant tenants
    const query = { status: 'active' };
    if (buildingId) query.building = buildingId;
    else query.owner = req.user._id;

    const tenants = await BedAllocation.find(query);
    for (const t of tenants) {
      await sendNotification({
        recipientId: t.tenant,
        role: 'tenant',
        title: `Announcement: ${title}`,
        message: message,
        type: 'announcement',
        relatedEntity: { entityType: 'Announcement', entityId: announcement._id },
      });
    }

    res.status(201).json({
      success: true,
      message: `Announcement posted to ${tenants.length} tenants.`,
      announcement,
    });
  } catch (error) {
    next(error);
  }
};

// Get announcements
export const getAnnouncements = async (req, res, next) => {
  try {
    let query = { isActive: true };

    if (req.user.role === 'tenant') {
      const alloc = await BedAllocation.findOne({ tenant: req.user._id, status: 'active' });
      if (alloc) {
        query.$or = [{ building: null }, { building: alloc.building }];
      }
    } else {
      query.owner = req.user._id;
    }

    const announcements = await Announcement.find(query).sort('-createdAt').limit(20);

    res.status(200).json({
      success: true,
      announcements,
    });
  } catch (error) {
    next(error);
  }
};
