import { Menu } from '../models/Menu.js';
import { Building } from '../models/Building.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { sendNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { getDayOfWeekIST } from '../utils/dateUtils.js';

// Get weekly menu for a building (all 7 days)
export const getWeeklyMenu = async (req, res, next) => {
  try {
    let { buildingId } = req.params;

    // If tenant requests without buildingId, determine from active allocation
    if (!buildingId && req.user.role === 'tenant') {
      const alloc = await BedAllocation.findOne({ tenant: req.user._id, status: 'active' });
      if (!alloc) {
        return res.status(404).json({ success: false, message: 'No active PG allocation found' });
      }
      buildingId = alloc.building;
    }

    // Default if owner has no building selected
    if (!buildingId && req.user.role === 'owner') {
      const b = await Building.findOne({ owner: req.user._id, isActive: true });
      if (b) buildingId = b._id;
    }

    if (!buildingId) {
      return res.status(400).json({ success: false, message: 'Building ID is required' });
    }

    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    let menus = await Menu.find({ building: buildingId });

    // If menus not created yet, populate defaults for all 7 days
    if (menus.length < 7) {
      const existingDays = menus.map(m => m.dayOfWeek);
      const missingDays = daysOrder.filter(d => !existingDays.includes(d));

      const defaults = missingDays.map(day => ({
        owner: req.user.role === 'owner' ? req.user._id : (menus[0]?.owner || req.user._id),
        building: buildingId,
        dayOfWeek: day,
        breakfast: { items: 'Idli, Sambar, Coconut Chutney, Tea/Coffee', timing: '07:30 - 09:30' },
        lunch: { items: 'Steamed Rice, Dal Tadka, Seasonal Sabzi, Curd, Chapati', timing: '12:30 - 14:30' },
        dinner: { items: 'Tawa Roti, Paneer Butter Masala, Jeera Rice, Salad', timing: '19:30 - 21:30' },
        isPublished: true,
      }));

      if (defaults.length > 0) {
        await Menu.insertMany(defaults);
        menus = await Menu.find({ building: buildingId });
      }
    }

    // Sort in natural weekly order starting Monday
    const sortedMenus = daysOrder.map(day => menus.find(m => m.dayOfWeek === day)).filter(Boolean);
    const todayDay = getDayOfWeekIST();

    res.status(200).json({
      success: true,
      todayDay,
      weeklyMenu: sortedMenus,
    });
  } catch (error) {
    next(error);
  }
};

// Update meal for a specific day
export const updateDayMenu = async (req, res, next) => {
  try {
    const { buildingId, dayOfWeek } = req.params;
    const { breakfast, lunch, dinner, isPublished = true, notifyTenants = false } = req.body;

    const building = await Building.findOne({ _id: buildingId, owner: req.user._id });
    if (!building) return res.status(403).json({ success: false, message: 'Unauthorized or building not found' });

    let menu = await Menu.findOne({ building: buildingId, dayOfWeek });

    if (!menu) {
      menu = new Menu({
        owner: req.user._id,
        building: buildingId,
        dayOfWeek,
      });
    }

    if (breakfast) menu.breakfast = { ...menu.breakfast, ...breakfast };
    if (lunch) menu.lunch = { ...menu.lunch, ...lunch };
    if (dinner) menu.dinner = { ...menu.dinner, ...dinner };
    menu.isPublished = isPublished;
    menu.lastUpdated = new Date();

    await menu.save();

    await logAudit({
      actor: req.user._id,
      actorRole: 'owner',
      action: 'FOOD_MENU_UPDATED',
      entityType: 'Menu',
      entityId: menu._id,
      details: { buildingId, dayOfWeek },
      req,
    });

    // Notify tenants if requested
    if (notifyTenants) {
      const activeTenants = await BedAllocation.find({ building: buildingId, status: 'active' });
      for (const t of activeTenants) {
        await sendNotification({
          recipientId: t.tenant,
          role: 'tenant',
          title: `Food Menu Updated (${dayOfWeek.toUpperCase()})`,
          message: `The meals for ${dayOfWeek} have been updated by your PG management. Check today's fresh menu!`,
          type: 'meal',
          relatedEntity: { entityType: 'Menu', entityId: menu._id },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Menu for ${dayOfWeek} updated successfully.`,
      menu,
    });
  } catch (error) {
    next(error);
  }
};

// Get today's menu
export const getTodayMenu = async (req, res, next) => {
  try {
    let { buildingId } = req.query;

    if (!buildingId && req.user.role === 'tenant') {
      const alloc = await BedAllocation.findOne({ tenant: req.user._id, status: 'active' });
      if (alloc) buildingId = alloc.building;
    }

    if (!buildingId && req.user.role === 'owner') {
      const b = await Building.findOne({ owner: req.user._id, isActive: true });
      if (b) buildingId = b._id;
    }

    const todayDay = getDayOfWeekIST();
    const menu = await Menu.findOne({ building: buildingId, dayOfWeek: todayDay });

    res.status(200).json({
      success: true,
      dayOfWeek: todayDay,
      menu: menu || {
        dayOfWeek: todayDay,
        breakfast: { items: 'Poha, Jalebi, Tea/Coffee', timing: '07:30 - 09:30' },
        lunch: { items: 'Rajma Chawal, Roti, Salad', timing: '12:30 - 14:30' },
        dinner: { items: 'Dal Makhani, Butter Roti, Kheer', timing: '19:30 - 21:30' },
      }
    });
  } catch (error) {
    next(error);
  }
};
