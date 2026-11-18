import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  floor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Floor',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  bedNumber: {
    type: String,
    required: true,
    trim: true,
  },
  monthlyRent: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'inactive'],
    default: 'available',
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  currentAllocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BedAllocation',
    default: null,
  },
  maintenanceReason: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

bedSchema.index({ room: 1, bedNumber: 1 }, { unique: true });

export const Bed = mongoose.model('Bed', bedSchema);
