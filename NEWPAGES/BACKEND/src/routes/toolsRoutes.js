const express = require("express");
const {
  getAllTools,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
} = require("../controllers/toolsController");

const router = express.Router();

router.get("/", getAllTools);
router.get("/:id", getToolById);
router.post("/", createTool);
router.put("/:id", updateTool);
router.delete("/:id", deleteTool);

module.exports = router;
