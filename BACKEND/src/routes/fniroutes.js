const express = require('express');
const { verifyToken, requireAnyRole } = require('../middleware/auth');
const {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  adjustStock,
  getRecentAdjustments
} = require('../controllers/fnicontroller');

const router = express.Router();

// Apply authentication middleware to all FNI routes
router.use(verifyToken);
router.use(requireAnyRole(['admin', 'inventory_manager']));

router.post('/items', createItem);
router.get('/items', listItems);
router.get('/items/:id', getItem);
router.patch('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);
router.post('/items/:id/adjust', adjustStock);
router.get('/adjustments', getRecentAdjustments);

module.exports = router;
