import mongoose from 'mongoose';

const buildingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Building name is required'],
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  totalFloors: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  description: {
    type: String,
    default: '',
  },
  amenities: [{
    type: String,
  }],
  rules: [{
    type: String,
  }],
  genderAllowed: {
    type: String,
    enum: ['boys', 'girls', 'co-living'],
    default: 'co-living',
  },
  mealTimings: {
    breakfast: { type: String, default: '07:30 - 09:30' },
    lunch: { type: String, default: '12:30 - 14:30' },
    dinner: { type: String, default: '19:30 - 21:30' },
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

export const Building = mongoose.model('Building', buildingSchema);
