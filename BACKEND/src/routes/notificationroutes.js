// BACKEND/src/routes/notificationroutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireAnyRole } = require('../middleware/auth');
const { createNotification, listNotifications, updateNotification, deleteNotification } = require('../controllers/notificationcontroller');


// Admin can post, edit, and delete notifications
router.post('/', verifyToken, requireAnyRole(['admin']), createNotification);
router.patch('/:id', verifyToken, requireAnyRole(['admin']), updateNotification);
router.delete('/:id', verifyToken, requireAnyRole(['admin']), deleteNotification);

// Admins and operational roles can view notifications
router.get(
  '/',
  verifyToken,
  requireAnyRole(['admin', 'worker', 'field_supervisor', 'production_manager', 'inventory_manager']),
  listNotifications
);

module.exports = router;
