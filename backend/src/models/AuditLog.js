import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  actorRole: {
    type: String,
    enum: ['owner', 'tenant', 'system'],
    default: 'system',
  },
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  entityId: {
    type: String,
    default: null,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
