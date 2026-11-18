import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'tenant'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['rent', 'meal', 'complaint', 'bed', 'announcement', 'general'],
    default: 'general',
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  relatedEntity: {
    entityType: { type: String, default: null },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  }
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
