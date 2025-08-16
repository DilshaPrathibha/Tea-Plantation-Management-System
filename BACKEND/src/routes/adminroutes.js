const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createUser,
  listUsers,
  resetPassword,
  deleteUser,
  updateUser
} = require('../controllers/admincontroller');

// Admin-only endpoints
router.post('/users', verifyToken, requireRole('admin'), createUser);
router.get('/users', verifyToken, requireRole('admin'), listUsers);
router.patch('/users/:id', verifyToken, requireRole('admin'), updateUser);
router.post('/users/:id/reset-password', verifyToken, requireRole('admin'), resetPassword);
router.delete('/users/:id', verifyToken, requireRole('admin'), deleteUser);

module.exports = router;
