const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const { addCondition, getConditions, updateCondition, getLatestCondition } = require("../controllers/conditionController");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("DOCTOR", "ADMIN"), addCondition);
router.get("/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN"), getConditions);
router.get("/latest/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN"), getLatestCondition);
router.put("/:id", authenticate, authorizeRoles("DOCTOR", "ADMIN"), updateCondition);

module.exports = router;