const express = require("express");
const {
  getAllTechnicians,
  // addTechnician,
  // updateTechnician,
  // deleteTechnician,
} = require("../controllers/techniciansController");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("Admin", "Technician", "Doctor"), getAllTechnicians);
// router.post("/", authenticate, authorizeRoles("Admin"), addTechnician);
// router.put("/:employee_id", authenticate, authorizeRoles("Admin"), updateTechnician);
// router.delete("/:employee_id", authenticate, authorizeRoles("Admin"), deleteTechnician);

module.exports = router;