const express = require("express");
const {
  getAllDoctors,
//   addDoctor,
  // updateDoctor,
  // deleteDoctor,
//   updateDoctorStatus,
} = require("../controllers/doctorsController");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("Technician", "Admin", "Doctor", "Employee"), getAllDoctors);
// router.post("/", authenticate, authorizeRoles("Admin"), addDoctor);
// router.put("/:employee_id", authenticate, authorizeRoles("Admin"), updateDoctor);
// router.delete("/:employee_id", authenticate, authorizeRoles("Admin"), deleteDoctor);
// router.put("/:employee_id/status", authenticate, authorizeRoles("Admin"), updateDoctorStatus);

module.exports = router;
