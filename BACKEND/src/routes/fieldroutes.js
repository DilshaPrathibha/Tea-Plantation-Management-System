// BACKEND/src/routes/fieldroutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireRole, requireAnyRole } = require('../middleware/auth');
const { listFields, getField, createField, updateField, deleteField } = require('../controllers/fieldcontroller');

// Read: admin, field_supervisor, production_manager, inventory_manager, and worker
router.get('/', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'production_manager', 'inventory_manager', 'worker']), listFields);
router.get('/:id', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'production_manager', 'inventory_manager', 'worker']), getField);

// Create/Update/Delete: admin only
router.post('/', verifyToken, requireRole('admin'), createField);
router.put('/:id', verifyToken, requireRole('admin'), updateField);
router.patch('/:id', verifyToken, requireRole('admin'), updateField);
router.delete('/:id', verifyToken, requireRole('admin'), deleteField);

module.exports = router;
