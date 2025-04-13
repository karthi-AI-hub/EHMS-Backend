const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const { getAnalyticsData } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("ADMIN", "EMPLOYEE", "TECHNICIAN", "DOCTOR"), getAnalyticsData);

module.exports = router;