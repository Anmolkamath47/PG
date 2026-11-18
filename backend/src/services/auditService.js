import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({
  actor = null,
  actorRole = 'system',
  action,
  entityType,
  entityId = null,
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : '';
    const userAgent = req ? req.headers['user-agent'] : '';

    await AuditLog.create({
      actor: actor || (req && req.user ? req.user._id : null),
      actorRole: actorRole || (req && req.user ? req.user.role : 'system'),
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};
