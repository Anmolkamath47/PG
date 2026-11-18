import mongoose from 'mongoose';

const bedAllocationSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joiningDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  checkoutDate: {
    type: Date,
    default: null,
  },
  monthlyRent: {
    type: Number,
    required: true,
  },
  securityDeposit: {
    type: Number,
    default: 0,
  },
  depositRefunded: {
    type: Boolean,
    default: false,
  },
  rentDueDay: {
    type: Number,
    min: 1,
    max: 31,
    default: 5,
  },
  status: {
    type: String,
    enum: ['active', 'transferred', 'checked_out'],
    default: 'active',
  },
  previousBed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    default: null,
  },
  notes: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

// Index to ensure efficient querying of active allocations
bedAllocationSchema.index({ tenant: 1, status: 1 });
bedAllocationSchema.index({ bed: 1, status: 1 });
bedAllocationSchema.index({ building: 1, status: 1 });

export const BedAllocation = mongoose.model('BedAllocation', bedAllocationSchema);
