// BACKEND/src/routes/peopleroutes.js
const express = require('express');
const router = express.Router();

const { verifyToken, requireAnyRole } = require('../middleware/auth');
const { search, byEmpId } = require('../controllers/peoplectrl');

// Allow admin + field_supervisor
router.use(verifyToken, requireAnyRole(['admin', 'field_supervisor']));

router.get('/search', search);
router.get('/by-empid/:empId', byEmpId);

module.exports = router;
