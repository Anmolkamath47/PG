import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
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
  roomNumber: {
    type: String,
    required: true,
    trim: true,
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'triple', 'four_sharing', 'dormitory'],
    default: 'double',
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 2,
  },
  baseRent: {
    type: Number,
    required: true,
    min: 0,
    default: 8000,
  },
  attachedBathroom: {
    type: Boolean,
    default: true,
  },
  acAvailable: {
    type: Boolean,
    default: false,
  },
  hasBalcony: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
  }
}, {
  timestamps: true,
});

roomSchema.index({ building: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model('Room', roomSchema);
