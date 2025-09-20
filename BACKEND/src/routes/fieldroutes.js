// BACKEND/src/routes/fieldroutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireAnyRole } = require('../middleware/auth');
const { listFields, createField, updateField, deleteField } = require('../controllers/fieldcontroller');

// Read: admin & field_supervisor
router.get('/', verifyToken, requireAnyRole(['admin', 'field_supervisor']), listFields);

// Create/Update/Delete: admin only
router.post('/', verifyToken, requireRole('admin'), createField);
router.put('/:id', verifyToken, requireRole('admin'), updateField);
router.patch('/:id', verifyToken, requireRole('admin'), updateField);
router.delete('/:id', verifyToken, requireRole('admin'), deleteField);

module.exports = router;
