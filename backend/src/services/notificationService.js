import { Notification } from '../models/Notification.js';
import { config } from '../config/env.js';

export const sendNotification = async ({
  recipientId,
  role,
  title,
  message,
  type = 'general',
  relatedEntity = { entityType: null, entityId: null },
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      role,
      title,
      message,
      type,
      relatedEntity,
    });

    // If Firebase Cloud Messaging is configured, send push notification
    if (config.fcm.serverKey) {
      try {
        // FCM Push dispatch structure
        /*
        await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${config.fcm.serverKey}`
          },
          body: JSON.stringify({
            to: `/topics/user_${recipientId}`,
            notification: { title, body: message }
          })
        });
        */
      } catch (fcmErr) {
        console.warn('FCM dispatch warning:', fcmErr.message);
      }
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
};
