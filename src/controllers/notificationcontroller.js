// PATCH /api/notifications/:id (admin only)
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });
    const notif = await Notification.findByIdAndUpdate(
      id,
      { title, content },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: notif });
  } catch (e) {
    console.error('[updateNotification]', e);
    res.status(500).json({ message: 'Failed to update notification' });
  }
};

// DELETE /api/notifications/:id (admin only)
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndDelete(id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (e) {
    console.error('[deleteNotification]', e);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};
// BACKEND/src/controllers/notificationcontroller.js
const Notification = require('../../models/notification');
const User = require('../../models/user');

// POST /api/notifications (admin only)
exports.createNotification = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content required' });
    const notif = await Notification.create({
      title,
      content,
      audience: 'worker',
      createdBy: req.user._id,
      createdAt: new Date()
    });
    res.status(201).json({ notification: notif });
  } catch (e) {
    console.error('[createNotification]', e);
    res.status(500).json({ message: 'Failed to create notification' });
  }
};

// GET /api/notifications (worker: get all for workers)
exports.listNotifications = async (req, res) => {
  try {
    // Only show notifications for workers for now
    const notifs = await Notification.find({ audience: 'worker' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ items: notifs });
  } catch (e) {
    console.error('[listNotifications]', e);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
};
