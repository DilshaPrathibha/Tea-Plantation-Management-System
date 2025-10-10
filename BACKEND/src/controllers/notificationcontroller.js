// BACKEND/src/controllers/notificationcontroller.js
const Notification = require('../../models/notification');

const SUPPORTED_ROLES = ['worker', 'admin', 'field_supervisor', 'production_manager', 'inventory_manager'];

const sanitizeAudience = (audience = []) => {
  if (Array.isArray(audience)) {
    const filtered = audience.filter((role) => SUPPORTED_ROLES.includes(role));
    if (filtered.length) {
      return [...new Set(filtered)];
    }
  }
  return [...SUPPORTED_ROLES];
};

// POST /api/notifications (admin only)
exports.createNotification = async (req, res) => {
  try {
    const { title, content, audience } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content required' });
    }

    const targets = sanitizeAudience(audience);
    const notif = await Notification.create({
      title: String(title).trim(),
      content: String(content).trim(),
      audience: targets,
      createdBy: req.user?._id,
    });

    res.status(201).json({ notification: notif });
  } catch (e) {
    console.error('[createNotification]', e);
    res.status(500).json({ message: 'Failed to create notification' });
  }
};

// GET /api/notifications (role-aware)
exports.listNotifications = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!role) {
      return res.status(403).json({ message: 'Unable to resolve user role' });
    }

    const query = role === 'admin' ? {} : { audience: { $in: [role] } };
    const limit = role === 'admin' ? 100 : 30;

    const docs = await Notification.find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    const normalized = docs
      .map((doc) => ({
        ...doc,
        updatedAt: doc.updatedAt || doc.createdAt || null,
        createdAt: doc.createdAt || doc.updatedAt || null,
      }))
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTime - aTime;
      });

    res.json({ items: normalized });
  } catch (e) {
    console.error('[listNotifications]', e);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
};

// PATCH /api/notifications/:id (admin only)
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content required' });
    }

    const notif = await Notification.findByIdAndUpdate(
      id,
      {
        title: String(title).trim(),
        content: String(content).trim(),
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

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
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted' });
  } catch (e) {
    console.error('[deleteNotification]', e);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};
