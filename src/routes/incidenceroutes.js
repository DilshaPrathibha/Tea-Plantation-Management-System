const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { 
    createIncidence,
    listIncidences,
    getIncidence,
    updateIncidence,
    deleteIncidence
} = require('../controllers/incidencecontroller');

router.post('/', verifyToken, createIncidence);
router.get('/', verifyToken, listIncidences);
router.get('/:id', verifyToken, getIncidence);
router.patch('/:id', verifyToken, updateIncidence);
router.delete('/:id', verifyToken, deleteIncidence);

module.exports = router;
