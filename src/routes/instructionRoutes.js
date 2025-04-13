const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const { addInstruction, getInstructions, getLatestInstructions } = require("../controllers/instructionController");

const router = express.Router();

router.post("/", authenticate, authorizeRoles("DOCTOR", "ADMIN"), addInstruction);
router.get("/:reportId", authenticate, authorizeRoles("DOCTOR", "ADMIN"), getInstructions);
router.get("/latest/:employeeId", authenticate, authorizeRoles("DOCTOR", "ADMIN", "TECHNICIAN", "EMPLOYEE"), getLatestInstructions);

module.exports = router;