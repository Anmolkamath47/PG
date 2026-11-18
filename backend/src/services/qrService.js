import QRCode from 'qrcode';
import crypto from 'crypto';
import { MealQRToken } from '../models/MealQRToken.js';
import { MealAttendance } from '../models/MealAttendance.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { User } from '../models/User.js';
import { getTodayIST, getMealExpiryTime } from '../utils/dateUtils.js';
import { logAudit } from './auditService.js';

export class QRService {
  /**
   * Generate or retrieve existing QR token for a tenant for a specific meal and date
   */
  static async getOrCreateMealQR(tenantId, mealType, date = getTodayIST()) {
    // 1. Verify active bed allocation
    const allocation = await BedAllocation.findOne({
      tenant: tenantId,
      status: 'active',
    }).populate('building');

    if (!allocation) {
      throw new Error('Tenant does not have an active PG room allocation');
    }

    // 2. Check if already attended
    const existingAttendance = await MealAttendance.findOne({
      tenant: tenantId,
      date,
      mealType,
    });

    if (existingAttendance) {
      return {
        status: 'used',
        message: 'Meal attendance already recorded for this session',
        attendance: existingAttendance,
        date,
        mealType,
      };
    }

    // 3. Find or create QR token
    let qrTokenDoc = await MealQRToken.findOne({
      tenant: tenantId,
      date,
      mealType,
    });

    const expiryTime = getMealExpiryTime(date, mealType);

    if (!qrTokenDoc) {
      // Create cryptographically strong random token
      const rawSecret = `${tenantId}_${allocation.building._id}_${mealType}_${date}_${crypto.randomBytes(16).toString('hex')}`;
      const token = `PGM_${crypto.createHash('sha256').update(rawSecret).digest('hex').slice(0, 32)}`;

      qrTokenDoc = await MealQRToken.create({
        token,
        tenant: tenantId,
        building: allocation.building._id,
        date,
        mealType,
        expiresAt: expiryTime,
        isUsed: false,
      });
    }

    // 4. Check if token is expired
    const isExpired = new Date() > new Date(qrTokenDoc.expiresAt);

    // 5. Generate QR Data URL
    // We encode an opaque JSON payload containing token, mealType, date (no sensitive PII inside QR payload)
    const qrPayload = JSON.stringify({
      t: qrTokenDoc.token,
      m: mealType,
      d: date,
      p: String(allocation.building._id),
    });

    const qrDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    });

    return {
      status: qrTokenDoc.isUsed ? 'used' : (isExpired ? 'expired' : 'available'),
      token: qrTokenDoc.token,
      qrDataUrl,
      mealType,
      date,
      expiresAt: qrTokenDoc.expiresAt,
      isUsed: qrTokenDoc.isUsed,
      usedAt: qrTokenDoc.usedAt,
      building: {
        id: allocation.building._id,
        name: allocation.building.name,
      }
    };
  }

  /**
   * Atomic verification and consumption of QR code by PG owner / staff
   */
  static async verifyAndConsumeQR({
    tokenString,
    scannerOwnerId,
    targetBuildingId = null,
    verificationMethod = 'qr_scan',
    notes = '',
    req = null,
  }) {
    // Check if tokenString is raw JSON payload from scanner or plain token
    let cleanToken = tokenString;
    try {
      if (tokenString.startsWith('{')) {
        const parsed = JSON.parse(tokenString);
        cleanToken = parsed.t || tokenString;
      }
    } catch (e) {
      cleanToken = tokenString;
    }

    cleanToken = cleanToken.trim();

    // 1. Fetch token record
    const tokenDoc = await MealQRToken.findOne({ token: cleanToken })
      .populate('tenant', 'name email phone avatar')
      .populate('building', 'name owner');

    if (!tokenDoc) {
      return {
        success: false,
        code: 'INVALID_QR',
        message: 'Invalid or expired QR code. No matching token found.',
      };
    }

    // 2. Verify owner owns this PG building
    if (tokenDoc.building.owner.toString() !== scannerOwnerId.toString()) {
      return {
        success: false,
        code: 'WRONG_PG',
        message: 'QR code belongs to a different PG building!',
      };
    }

    // 3. Check if already used
    if (tokenDoc.isUsed) {
      return {
        success: false,
        code: 'ALREADY_USED',
        message: 'This QR code has already been used.',
        usedAt: tokenDoc.usedAt,
        mealType: tokenDoc.mealType,
        date: tokenDoc.date,
        tenant: tokenDoc.tenant,
      };
    }

    // 4. Check expiration
    if (new Date() > new Date(tokenDoc.expiresAt)) {
      return {
        success: false,
        code: 'EXPIRED',
        message: 'This QR code has expired for the configured meal time.',
        expiresAt: tokenDoc.expiresAt,
      };
    }

    // 5. ATOMIC CONSUMPTION:
    // Use findOneAndUpdate with condition `isUsed: false` to ensure atomic single-scan guarantee
    const consumedToken = await MealQRToken.findOneAndUpdate(
      {
        _id: tokenDoc._id,
        isUsed: false,
      },
      {
        $set: {
          isUsed: true,
          usedAt: new Date(),
          scannedBy: scannerOwnerId,
        }
      },
      { new: true }
    );

    if (!consumedToken) {
      return {
        success: false,
        code: 'ALREADY_USED',
        message: 'This QR code has already been used (concurrent scan detected).',
      };
    }

    // 6. Record meal attendance
    const attendance = await MealAttendance.findOneAndUpdate(
      {
        tenant: tokenDoc.tenant._id,
        date: tokenDoc.date,
        mealType: tokenDoc.mealType,
      },
      {
        $setOnInsert: {
          tenant: tokenDoc.tenant._id,
          building: tokenDoc.building._id,
          date: tokenDoc.date,
          mealType: tokenDoc.mealType,
          scanTime: new Date(),
          scannedBy: scannerOwnerId,
          verificationMethod,
          tokenUsed: cleanToken,
          notes,
        }
      },
      { upsert: true, new: true }
    );

    // Fetch tenant room details for confirmation UI
    const allocation = await BedAllocation.findOne({
      tenant: tokenDoc.tenant._id,
      status: 'active',
    })
      .populate('room', 'roomNumber roomType')
      .populate('bed', 'bedNumber');

    // Audit log
    await logAudit({
      actor: scannerOwnerId,
      actorRole: 'owner',
      action: 'MEAL_ATTENDANCE_RECORDED',
      entityType: 'MealAttendance',
      entityId: attendance._id,
      details: {
        tenantId: tokenDoc.tenant._id,
        tenantName: tokenDoc.tenant.name,
        mealType: tokenDoc.mealType,
        date: tokenDoc.date,
        verificationMethod,
      },
      req,
    });

    return {
      success: true,
      message: 'Meal attendance recorded successfully.',
      attendance: {
        id: attendance._id,
        mealType: tokenDoc.mealType,
        date: tokenDoc.date,
        scanTime: attendance.scanTime,
        verificationMethod,
      },
      tenant: {
        id: tokenDoc.tenant._id,
        name: tokenDoc.tenant.name,
        email: tokenDoc.tenant.email,
        phone: tokenDoc.tenant.phone,
        avatar: tokenDoc.tenant.avatar,
        roomNumber: allocation?.room?.roomNumber || 'N/A',
        bedNumber: allocation?.bed?.bedNumber || 'N/A',
        buildingName: tokenDoc.building.name,
      }
    };
  }

  /**
   * Manual fallback attendance recording by Owner
   */
  static async recordManualAttendance({
    tenantId,
    buildingId,
    mealType,
    date = getTodayIST(),
    scannerOwnerId,
    notes = 'Manual attendance recorded by owner',
    req = null,
  }) {
    // Check if already recorded
    const existing = await MealAttendance.findOne({
      tenant: tenantId,
      date,
      mealType,
    });

    if (existing) {
      return {
        success: false,
        message: `Attendance already recorded for this tenant for ${mealType} on ${date}.`,
      };
    }

    const attendance = await MealAttendance.create({
      tenant: tenantId,
      building: buildingId,
      date,
      mealType,
      scanTime: new Date(),
      scannedBy: scannerOwnerId,
      verificationMethod: 'manual_fallback',
      notes,
    });

    // Mark any existing token as used
    await MealQRToken.findOneAndUpdate(
      { tenant: tenantId, date, mealType },
      { isUsed: true, usedAt: new Date(), scannedBy: scannerOwnerId }
    );

    const tenantUser = await User.findById(tenantId).select('name email phone avatar');
    const allocation = await BedAllocation.findOne({ tenant: tenantId, status: 'active' })
      .populate('room', 'roomNumber')
      .populate('bed', 'bedNumber')
      .populate('building', 'name');

    await logAudit({
      actor: scannerOwnerId,
      actorRole: 'owner',
      action: 'MEAL_ATTENDANCE_MANUAL',
      entityType: 'MealAttendance',
      entityId: attendance._id,
      details: { tenantId, mealType, date, notes },
      req,
    });

    return {
      success: true,
      message: 'Meal attendance recorded manually.',
      attendance,
      tenant: {
        id: tenantUser?._id,
        name: tenantUser?.name,
        email: tenantUser?.email,
        phone: tenantUser?.phone,
        roomNumber: allocation?.room?.roomNumber || 'N/A',
        bedNumber: allocation?.bed?.bedNumber || 'N/A',
        buildingName: allocation?.building?.name || 'N/A',
      }
    };
  }
}
