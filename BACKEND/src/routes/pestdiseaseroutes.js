const express = require('express');
const router = express.Router();
const { verifyToken, requireAnyRole } = require('../middleware/auth');
const { 
  createPestDisease,
  listPestDiseases,
  getPestDisease,
  updatePestDisease,
  deletePestDisease
} = require('../controllers/pestdiseasecontroller');

// POST, PATCH, DELETE - Only field supervisors can create/edit/delete
router.post('/', verifyToken, requireAnyRole(['field_supervisor']), createPestDisease);
router.patch('/:id', verifyToken, requireAnyRole(['field_supervisor']), updatePestDisease);
router.delete('/:id', verifyToken, requireAnyRole(['field_supervisor']), deletePestDisease);

// GET - Both field supervisors and inventory managers can view
router.get('/', verifyToken, requireAnyRole(['field_supervisor', 'inventory_manager']), listPestDiseases);
router.get('/:id', verifyToken, requireAnyRole(['field_supervisor', 'inventory_manager']), getPestDisease);

module.exports = router;