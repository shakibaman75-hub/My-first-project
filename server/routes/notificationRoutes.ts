import { Router } from 'express';
import { db } from '../db.ts';
import { authenticateToken, AuthRequest } from '../auth.ts';

const router = Router();

// GET /api/notifications - User's Notifications
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Include doctor userId if user is doctor
    const userIds = [req.user._id];
    if (req.user.role === 'doctor') {
      const doc = db.doctors.find((d) => d.userId === req.user?._id || d.email === req.user?.email);
      if (doc) userIds.push(doc._id);
    }

    const list = db.notifications
      .filter((n) => userIds.includes(n.userId) || (req.user?.role === 'admin' && n.userId === 'usr_admin'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const unreadCount = list.filter((n) => !n.isRead).length;

    return res.json({
      success: true,
      total: list.length,
      unreadCount,
      notifications: list,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

// PUT /api/notifications/:id/read - Mark Read
router.put('/:id/read', authenticateToken, (req: AuthRequest, res) => {
  try {
    const notif = db.notifications.find((n) => n._id === req.params.id);
    if (notif) {
      notif.isRead = true;
    }
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// PUT /api/notifications/read-all - Mark All Read
router.put('/read-all', authenticateToken, (req: AuthRequest, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const userIds = [req.user._id];
    if (req.user.role === 'doctor') {
      const doc = db.doctors.find((d) => d.userId === req.user?._id || d.email === req.user?.email);
      if (doc) userIds.push(doc._id);
    }

    db.notifications.forEach((n) => {
      if (userIds.includes(n.userId) || (req.user?.role === 'admin' && n.userId === 'usr_admin')) {
        n.isRead = true;
      }
    });

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
});

export default router;
