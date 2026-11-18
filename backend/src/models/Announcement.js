import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  building: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    default: null, // null means all buildings owned by this owner
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['normal', 'important', 'urgent'],
    default: 'normal',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: null,
  }
}, {
  timestamps: true,
});

export const Announcement = mongoose.model('Announcement', announcementSchema);
