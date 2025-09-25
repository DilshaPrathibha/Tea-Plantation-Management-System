// BACKEND/src/routes/attendanceroutes.js
const express = require('express');
const router = express.Router();

const { verifyToken, requireAnyRole } = require('../middleware/auth');
const {
  createAttendance,
  listAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance,
  checkInAuto,
  checkOutAuto,
} = require('../controllers/attendancecontroller');

router.use(verifyToken, requireAnyRole(['admin', 'field_supervisor']));

// QR endpoints
router.post('/checkin', checkInAuto);
router.post('/checkout', checkOutAuto);

// CRUD
router.post('/', createAttendance);
router.get('/', listAttendance);
router.get('/:id', getAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;
