const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const { addAllergy, getAllergies, updateAllergy, getLatestAllergy } = require("../controllers/allergyController");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("DOCTOR", "ADMIN"), addAllergy);
router.get("/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN", "EMPLOYEE"), getAllergies);
router.get("/latest/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN", "EMPLOYEE"), getLatestAllergy);
router.put("/:id", authenticate, authorizeRoles("DOCTOR", "ADMIN"), updateAllergy);

module.exports = router;