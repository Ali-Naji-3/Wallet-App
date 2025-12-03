import { listNotificationsForUser, markNotificationRead } from '../models/notificationModel.js';

export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const notifications = await listNotificationsForUser(userId, { limit });

    return res.json({ notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ message: 'Failed to load notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notificationId = parseInt(req.params.id, 10);
    if (!notificationId) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    await markNotificationRead(userId, notificationId);

    return res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
};


