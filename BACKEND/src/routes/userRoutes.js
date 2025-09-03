const router = require("express").Router();
const { listByRole } = require("../controllers/UserController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

// only admin + field_supervisor can see worker list
router.get("/", auth, requireRole("admin","field_supervisor"), listByRole);

module.exports = router;
