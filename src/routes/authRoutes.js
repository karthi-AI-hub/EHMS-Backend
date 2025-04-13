const express = require("express");
const { login, forgotPassword, changePassword, logout } = require("../controllers/authController");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit"); // Import rateLimit

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
});

router.post(
  "/login",
  loginLimiter, 
  [
    body("employeeId").isString().notEmpty().withMessage("Employee ID is required."),
    body("password").isString().notEmpty().withMessage("Password is required."),
  ],
  login
);

router.post(
  "/forgot-password",
  [
    body("email").isEmail().withMessage("Valid email is required."),
  ],
  forgotPassword
);
router.post("/change-password", changePassword);
router.post("/logout", logout);

module.exports = router;
