const express = require('express');
const router = express.Router();
const {
  generateTransportReport,
  getTransportReports,
  deleteTransportReport
 
} = require('../controllers/transportReportController');
const { verifyToken, requireAnyRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireAnyRole(['admin', 'production_manager', 'field_supervisor']));

router.post('/generate', generateTransportReport);
router.get('/', getTransportReports);
router.delete('/:id', deleteTransportReport);

module.exports = router;