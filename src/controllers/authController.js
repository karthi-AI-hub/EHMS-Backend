const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { generateToken } = require("../config/jwt");
const jwt = require("jsonwebtoken");

const tokenBlacklist = new Set();

const login = async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res
      .status(400)
      .json({ error: "Employee ID and password are required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE employee_id = ?",
      [employeeId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }

    const user = rows[0];

    if (user.first_login) {
      if (password === user.employee_id) {
        const token = generateToken({
          employee_id: user.employee_id,
          role: user.role,
          name: user.name,
        });

        return res.status(200).json({
          firstTime: true,
          message: "First login detected. Please change your password.",
          token,
        });
      } else {
        return res
          .status(401)
          .json({ error: "Invalid password for first-time login." });
      }
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid password." });
    }

    const token = generateToken({
      employee_id: user.employee_id,
      role: user.role,
      name: user.name,
    });

    res.json({
      message: "Login successful!",
      token,
      firstTime: false,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const forgotPassword = async (req, res) => {
  const { employeeId, newPassword } = req.body;

  if (!employeeId || !newPassword) {
    return res
      .status(400)
      .json({ error: "Employee ID and new password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute("UPDATE users SET password = ? WHERE employee_id = ?", [
      hashedPassword,
      employeeId,
    ]);

    res.json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const changePassword = async (req, res) => {
  const { employeeId, currentPassword, newPassword } = req.body;

  if (!employeeId || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT employee_id, password, first_login FROM users WHERE employee_id = ?",
      [employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Employee not found." });
    }

    const user = rows[0];

    if (user.first_login) {
      if (currentPassword !== user.employee_id) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
    } else {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect." });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.execute(
      "UPDATE users SET password = ?, first_login = 0 WHERE employee_id = ?",
      [hashedPassword, employeeId]
    );

    res.json({
      message: "Password updated successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const logout = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(400).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    tokenBlacklist.add(token);

    res.json({ message: "Logout successful!" });
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Token is already expired or invalid" });
  }
};

const isTokenBlacklisted = (token) => tokenBlacklist.has(token);

module.exports = {
  login,
  forgotPassword,
  logout,
  changePassword,
  isTokenBlacklisted,
};
