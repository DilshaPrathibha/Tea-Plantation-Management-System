const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createPestDiseaseReport,
  listPestDiseaseReports,
  getPestDiseaseReport,
  updatePestDiseaseReport,
  deletePestDiseaseReport,
  requestInventory
} = require('../controllers/pestdiseasecontroller');

// Field supervisor can create reports
router.post('/', verifyToken, requireRole('field_supervisor'), createPestDiseaseReport);

// Admin and inventory manager can view all reports
router.get('/', verifyToken, listPestDiseaseReports);

// Get specific report
router.get('/:id', verifyToken, getPestDiseaseReport);

// Field supervisor can update their reports
router.patch('/:id', verifyToken, requireRole('field_supervisor'), updatePestDiseaseReport);

// Field supervisor can delete only resolved reports
router.delete('/:id', verifyToken, requireRole('field_supervisor'), deletePestDiseaseReport);

// Request inventory items
router.post('/:id/request-inventory', verifyToken, requireRole('field_supervisor'), requestInventory);

module.exports = router;
