import mongoose from 'mongoose';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Owner } from '../models/Owner.js';
import { Tenant } from '../models/Tenant.js';
import { Building } from '../models/Building.js';
import { Floor } from '../models/Floor.js';
import { Room } from '../models/Room.js';
import { Bed } from '../models/Bed.js';
import { BedAllocation } from '../models/BedAllocation.js';
import { Menu } from '../models/Menu.js';
import { RentInvoice } from '../models/RentInvoice.js';
import { Payment } from '../models/Payment.js';
import { MealAttendance } from '../models/MealAttendance.js';
import { Complaint } from '../models/Complaint.js';
import { Notification } from '../models/Notification.js';
import { Announcement } from '../models/Announcement.js';
import { AuditLog } from '../models/AuditLog.js';

export const clearDummyData = async () => {
  try {
    await connectDB();
    console.log('🧹 Clearing all collections to remove any dummy/test data...');

    await Promise.all([
      User.deleteMany({}),
      Owner.deleteMany({}),
      Tenant.deleteMany({}),
      Building.deleteMany({}),
      Floor.deleteMany({}),
      Room.deleteMany({}),
      Bed.deleteMany({}),
      BedAllocation.deleteMany({}),
      Menu.deleteMany({}),
      RentInvoice.deleteMany({}),
      Payment.deleteMany({}),
      MealAttendance.deleteMany({}),
      Complaint.deleteMany({}),
      Notification.deleteMany({}),
      Announcement.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('✅ All dummy data cleared successfully! Database is completely clean.');
    await closeDB();
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

if (process.argv[1]?.endsWith('clearDummyData.js')) {
  clearDummyData();
}
