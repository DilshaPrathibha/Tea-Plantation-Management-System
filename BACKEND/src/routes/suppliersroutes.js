const express = require("express");
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  suspendSupplier,
  activateSupplier,
} = require("../controllers/suppliersController");

const router = express.Router();

router.get("/", getAllSuppliers);
router.get("/:id", getSupplierById);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);
router.post("/:id/suspend", suspendSupplier);
router.post("/:id/activate", activateSupplier);

module.exports = router;