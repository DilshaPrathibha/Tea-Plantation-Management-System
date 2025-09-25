const express = require('express');
const router = express.Router();
const {
  getAllTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
} = require('../controllers/transportController');

// Add authentication middleware
const { verifyToken, requireAnyRole } = require('../middleware/auth');

// Allow GET for all (for GPS map)
router.get('/', getAllTransports);
router.get('/:id', getTransportById);

// Auth for write actions
router.use(verifyToken);
router.use(requireAnyRole(['admin', 'production_manager', 'field_supervisor']));

router.post('/', createTransport);
router.put('/:id', updateTransport);
router.delete('/:id', deleteTransport);

module.exports = router;