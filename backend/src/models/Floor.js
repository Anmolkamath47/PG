import mongoose from 'mongoose';

const floorSchema = new mongoose.Schema({
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  floorNumber: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
}, {
  timestamps: true,
});

floorSchema.index({ building: 1, floorNumber: 1 }, { unique: true });

export const Floor = mongoose.model('Floor', floorSchema);
