const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/get-user',verifyToken,requireRole('field_supervisor', 'admin') , authController.getUsers)

module.exports = router;
