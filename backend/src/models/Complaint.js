import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintNumber: {
    type: String,
    required: true,
    unique: true,
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
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  category: {
    type: String,
    enum: ['water', 'electricity', 'fan', 'ac', 'wifi', 'bathroom', 'cleaning', 'food', 'other'],
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  images: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  ownerResponse: {
    type: String,
    default: '',
  },
  assignedTo: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    assignedAt: { type: Date, default: null }
  },
  resolvedAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

complaintSchema.index({ building: 1, status: 1 });
complaintSchema.index({ tenant: 1, status: 1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
