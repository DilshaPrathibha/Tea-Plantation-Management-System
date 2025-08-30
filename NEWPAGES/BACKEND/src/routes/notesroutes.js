const express = require("express");
const {
  getAllPestNutrients,
  getPestNutrientById,
  createPestNutrient,
  updatePestNutrient,
  deletePestNutrient,
} = require("../controllers/pestNutrientController");

const router = express.Router();

router.get("/", getAllPestNutrients);
router.get("/:id", getPestNutrientById);
router.post("/", createPestNutrient);
router.put("/:id", updatePestNutrient);
router.delete("/:id", deletePestNutrient);

module.exports = router;