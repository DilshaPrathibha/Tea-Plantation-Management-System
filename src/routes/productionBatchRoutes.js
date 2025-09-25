const express = require('express');
const router = express.Router();
const {
	getAllBatches,
	getBatchById,
	createBatch,
	updateBatch,
	deleteBatch
} = require('../controllers/productionBatchController');

router.get('/', getAllBatches);
router.get('/:id', getBatchById);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

module.exports = router;
