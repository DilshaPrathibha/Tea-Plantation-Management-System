// BACKEND/src/routes/fieldroutes.js
const express = require('express');
const router = express.Router();

// If you already have these middlewares, keep them. Otherwise you can temporarily comment them to test.
// const { verifyToken, requireRole } = require('../middleware/auth');

const {
  createField,
  listFields,
  updateField,
  deleteField,
} = require('../controllers/fieldcontroller');

// Admin-only (uncomment if auth middleware is ready)
// router.get('/', verifyToken, requireRole('admin'), listFields);
// router.post('/', verifyToken, requireRole('admin'), createField);
// router.patch('/:id', verifyToken, requireRole('admin'), updateField);
// router.delete('/:id', verifyToken, requireRole('admin'), deleteField);

// TEMP: open routes for quick testing (remove once verified)
router.get('/', listFields);
router.post('/', createField);
router.patch('/:id', updateField);
router.delete('/:id', deleteField);

module.exports = router;
