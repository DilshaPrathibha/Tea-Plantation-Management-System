const express = require("express");
const {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  assignTool,
  unassignTool,
} = require("../controllers/toolsController");

const router = express.Router();

router.get("/", getAllTools);
router.get("/:id", getToolById);
router.post("/", createTool);
router.put("/:id", updateTool);
router.delete("/:id", deleteTool);
router.post("/:id/assign", assignTool);
router.post("/:id/unassign", unassignTool);

module.exports = router;
