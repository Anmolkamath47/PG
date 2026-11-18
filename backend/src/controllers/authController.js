import { User } from '../models/User.js';
import { Owner } from '../models/Owner.js';
import { Tenant } from '../models/Tenant.js';
import { Building } from '../models/Building.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { generateToken } from '../utils/jwt.js';
import { logAudit } from '../services/auditService.js';
import crypto from 'crypto';

export const registerOwner = async (req, res, next) => {
  try {
    const { name, email, phone, password, businessName, upiId, address } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, and password.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'owner',
    });

    const owner = await Owner.create({
      user: user._id,
      businessName: businessName || `${name}'s PGs`,
      contactPhone: phone,
      upiId: upiId || '',
      address: address || {},
    });

    const token = generateToken(user._id, user.role);

    await logAudit({
      actor: user._id,
      actorRole: 'owner',
      action: 'OWNER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: { businessName },
      req,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        businessName: owner.businessName,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const registerTenant = async (req, res, next) => {
  try {
    const { name, email, phone, password, pgOwnerId, emergencyContact, occupation, companyOrCollege } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, and password.',
      });
    }

    // Tenant must be associated with a valid PG owner
    let ownerId = pgOwnerId;
    if (!ownerId) {
      // Find default or first owner if not specified in demo/registration
      const defaultOwner = await User.findOne({ role: 'owner' });
      if (!defaultOwner) {
        return res.status(400).json({
          success: false,
          message: 'A tenant must be linked to a registered PG owner. Please contact your PG owner.',
        });
      }
      ownerId = defaultOwner._id;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'tenant',
      pgOwnerId: ownerId,
    });

    const tenant = await Tenant.create({
      user: user._id,
      owner: ownerId,
      emergencyContact: emergencyContact || {},
      occupation: occupation || 'working_professional',
      companyOrCollege: companyOrCollege || '',
      status: 'active',
    });

    const token = generateToken(user._id, user.role);

    await logAudit({
      actor: user._id,
      actorRole: 'tenant',
      action: 'TENANT_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      details: { ownerId },
      req,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password, role } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or phone and password.',
      });
    }

    // Query user by email or phone
    const cleanId = identifier.trim().toLowerCase();
    const query = {
      $or: [{ email: cleanId }, { phone: identifier.trim() }],
    };
    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
      });
    }

    const token = generateToken(user._id, user.role);

    let extraData = {};
    if (user.role === 'owner') {
      const owner = await Owner.findOne({ user: user._id });
      extraData = { businessName: owner?.businessName || 'PGmate' };
    } else {
      const tenant = await Tenant.findOne({ user: user._id });
      const allocation = await BedAllocation.findOne({ tenant: user._id, status: 'active' })
        .populate('building', 'name address')
        .populate('room', 'roomNumber roomType')
        .populate('bed', 'bedNumber');
      extraData = {
        tenantId: tenant?._id,
        allocation: allocation ? {
          building: allocation.building,
          room: allocation.room,
          bed: allocation.bed,
          monthlyRent: allocation.monthlyRent,
        } : null
      };
    }

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        ...extraData,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let details = {};

    if (user.role === 'owner') {
      const owner = await Owner.findOne({ user: user._id });
      details = { owner };
    } else {
      const tenant = await Tenant.findOne({ user: user._id });
      const allocation = await BedAllocation.findOne({ tenant: user._id, status: 'active' })
        .populate('building')
        .populate('room')
        .populate('bed');
      details = { tenant, allocation };
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      details,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, businessName, upiId, address } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();

    if (user.role === 'owner') {
      const owner = await Owner.findOne({ user: user._id });
      if (owner) {
        if (businessName) owner.businessName = businessName;
        if (upiId) owner.upiId = upiId;
        if (address) owner.address = { ...owner.address, ...address };
        await owner.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      }
    });
  } catch (error) {
    next(error);
  }
};
