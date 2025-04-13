const express = require("express");
const {
  getEmployee,
  updateEmployee,
  addEmployee,
  getFamilyMembers,
  getAccess,
} = require("../controllers/employeeController");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/:employeeId",
  authenticate,
  authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
  getEmployee
);

router.put(
  "/:employee_Id",
  authenticate,
  authorizeRoles("Admin"),
  updateEmployee
);

router.post(
    "/", 
    authenticate, 
    authorizeRoles("Admin"), 
    addEmployee
);

router.get(
  "/:employeeID/family",
  authenticate,
  authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
  getFamilyMembers,
)

// router.get(
//   '/checkAccess',
//   authenticate,
//   authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
//   getAccess,
// )
// 
// router.get(
//     "/all",
//     authenticate,
//     authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
//     async (req, res, next) => {
//         try {
//             console.log("✅ Route /all reached, calling getAllEmployees...");
//             await getAllEmployees(req, res, next); // Call the function
//             console.log("✅ Response sent successfully from /all route.");
//         } catch (error) {
//             console.error("Error in /all route:", error);
//             next(error); // Pass the error to the error-handling middleware
//         }
//     }
// );

module.exports = router;
