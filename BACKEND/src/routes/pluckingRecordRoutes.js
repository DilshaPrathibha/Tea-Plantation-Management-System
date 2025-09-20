// BACKEND/routes/pluckingRecordRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPluckingRecord,
  listPluckingRecords,
  getPluckingRecord,
  updatePluckingRecord,
  deletePluckingRecord,
  getFieldWorkers
} = require('../controllers/pluckingRecordController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Routes
router.get('/field-workers', getFieldWorkers);
router.post('/', createPluckingRecord);
router.get('/', listPluckingRecords);
router.get('/:id', getPluckingRecord);
router.put('/:id', updatePluckingRecord);
router.delete('/:id', deletePluckingRecord);

module.exports = router;