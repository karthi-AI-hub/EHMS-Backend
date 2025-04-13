const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const { getAdminDashboardStats, getEmployeeDashboardStats } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/admin", authenticate, authorizeRoles("ADMIN", "EMPLOYEE", "TECHNICIAN", "DOCTOR" ), getAdminDashboardStats);
router.get("/employee", authenticate, authorizeRoles("ADMIN", "EMPLOYEE", "TECHNICIAN", "DOCTOR"), getEmployeeDashboardStats);

module.exports = router;

//     authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
