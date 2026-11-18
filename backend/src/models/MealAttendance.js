import mongoose from 'mongoose';

const mealAttendanceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true,
  },
  scanTime: {
    type: Date,
    default: Date.now,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  verificationMethod: {
    type: String,
    enum: ['qr_scan', 'manual_fallback'],
    default: 'qr_scan',
  },
  tokenUsed: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

// Ensure only one successful attendance record per tenant per meal per date
mealAttendanceSchema.index({ tenant: 1, date: 1, mealType: 1 }, { unique: true });
mealAttendanceSchema.index({ building: 1, date: 1 });

export const MealAttendance = mongoose.model('MealAttendance', mealAttendanceSchema);
