// BACKEND/src/routes/attendanceroutes.js
const express = require('express');
const router = express.Router();

const { verifyToken, requireAnyRole } = require('../middleware/auth');
const {
  createAttendance,
  listAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendancecontroller');

// Only admins and field supervisors may manage attendance
router.use(verifyToken, requireAnyRole(['admin', 'field_supervisor']));

router.post('/', createAttendance);
router.get('/', listAttendance);
router.get('/:id', getAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

module.exports = router;
