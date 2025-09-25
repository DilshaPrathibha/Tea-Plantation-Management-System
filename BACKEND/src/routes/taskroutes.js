// BACKEND/src/routes/taskroutes.js
const express = require('express');
const router = express.Router();

const { verifyToken, requireAnyRole } = require('../middleware/auth');
const {
  eligibleWorkers,
  listToday,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskcontroller');

router.use(verifyToken, requireAnyRole(['admin', 'field_supervisor']));

router.get('/eligible-workers', eligibleWorkers);
router.get('/today', listToday);

router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
