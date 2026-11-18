import mongoose from 'mongoose';

const mealQRTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
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
    type: String, // Format: YYYY-MM-DD in PG local timezone
    required: true,
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
    index: true,
  },
  usedAt: {
    type: Date,
    default: null,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  }
}, {
  timestamps: true,
});

// Ensure a tenant has at most one QR token per meal per date
mealQRTokenSchema.index({ tenant: 1, date: 1, mealType: 1 }, { unique: true });
mealQRTokenSchema.index({ building: 1, date: 1, mealType: 1 });

export const MealQRToken = mongoose.model('MealQRToken', mealQRTokenSchema);
