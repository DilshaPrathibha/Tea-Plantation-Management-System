// BACKEND/src/routes/incidenceroutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, requireAnyRole } = require('../middleware/auth');
const { 
    createIncidence,
    listIncidences,
    getIncidence,
    updateIncidence,
    deleteIncidence
     
} = require('../controllers/incidencecontroller');

// Fix the route order to avoid conflicts 
// Allow admin, field_supervisor, and worker to access incidence routes
router.post('/', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'worker']), createIncidence);
router.get('/', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'worker']), listIncidences);
router.get('/:id', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'worker']), getIncidence);
router.patch('/:id', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'worker']), updateIncidence);
router.delete('/:id', verifyToken, requireAnyRole(['admin', 'field_supervisor', 'worker']), deleteIncidence);

module.exports = router;