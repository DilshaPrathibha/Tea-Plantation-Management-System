const express = require("express");
const router = express.Router();
const TaskAssignmentController = require("../controllers/TaskAssignmentController");
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/assign-task', verifyToken, requireRole('field_supervisor'), TaskAssignmentController.createTask);



router.get(
  "/get-tasks",
  verifyToken,
  requireRole("field_supervisor"),
  TaskAssignmentController.getTasks
);

router.put(
  "/update-task/:id",
  verifyToken,
  requireRole("field_supervisor"),
  TaskAssignmentController.updateTask
);

router.delete(
  "/delete-task/:id",
  verifyToken,
  requireRole("field_supervisor"),
  TaskAssignmentController.deleteTask
);

module.exports = router;


