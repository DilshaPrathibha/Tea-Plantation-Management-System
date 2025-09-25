const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireAnyRole } = require('../middleware/auth');
const {
  createUser,
  listUsers,
  listWorkers,
  resetPassword,
  deleteUser,
  updateUser
} = require('../controllers/admincontroller');

// Admin-only endpoints
router.post('/users', verifyToken, requireAnyRole(['admin', 'production_manager']), createUser);
router.get('/users', verifyToken, requireAnyRole(['admin', 'production_manager']), listUsers);
router.get('/workers', verifyToken, requireAnyRole(['admin', 'production_manager', 'inventory_manager']), listWorkers);
router.patch('/users/:id', verifyToken, requireAnyRole(['admin', 'production_manager']), updateUser);
router.post('/users/:id/reset-password', verifyToken, requireAnyRole(['admin', 'production_manager']), resetPassword);
router.delete('/users/:id', verifyToken, requireAnyRole(['admin', 'production_manager']), deleteUser);

module.exports = router;
