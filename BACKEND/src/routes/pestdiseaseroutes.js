const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { 
  createPestDisease,
  listPestDiseases,
  getPestDisease,
  updatePestDisease,
  deletePestDisease
} = require('../controllers/pestdiseasecontroller');

router.post('/', verifyToken, createPestDisease);
router.get('/', verifyToken, listPestDiseases);
router.get('/:id', verifyToken, getPestDisease);
router.patch('/:id', verifyToken, updatePestDisease);
router.delete('/:id', verifyToken, deletePestDisease);

module.exports = router;