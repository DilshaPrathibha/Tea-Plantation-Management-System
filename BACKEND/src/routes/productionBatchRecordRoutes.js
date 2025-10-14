const express = require('express');
const router = express.Router();
const {
  generateProductionBatchRecord,
  getProductionBatchRecords,
  deleteProductionBatchRecord,
  testProductionBatches
} = require('../controllers/productionBatchRecordController');
const { verifyToken, requireAnyRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireAnyRole(['admin', 'production_manager', 'field_supervisor']));

router.post('/generate', generateProductionBatchRecord);
router.get('/', getProductionBatchRecords);
router.get('/test', testProductionBatches);
router.delete('/:id', deleteProductionBatchRecord);

module.exports = router;