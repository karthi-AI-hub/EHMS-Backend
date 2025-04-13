const pool = require("../config/db");

// Get all technicians
const getAllTechnicians = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.employee_id, u.name, u.email, u.phone, u.address, 
              u.department, u.status, u.role, u.created_at,
              COUNT(f.dependent_id) as family_count
       FROM users u
       LEFT JOIN family_members f ON u.employee_id = f.employee_id
       WHERE u.role = 'TECHNICIAN'
       GROUP BY u.employee_id`
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No technicians found" });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error fetching technicians:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add a new technician
// const addTechnician = async (req, res) => {
//   const { name, email, phone, address, department, status } = req.body;

//   try {
//     const [result] = await pool.execute(
//       `INSERT INTO users (employee_id, name, email, phone, address, department, role, status, password, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, 'TECHNICIAN', ?, ?, NOW())`,
//       [
//         `T${Date.now()}`, // Generate a unique employee ID
//         name,
//         email,
//         phone,
//         address,
//         department,
//         status || "active",
//         "defaultPassword", // Default password (should be hashed in production)
//       ]
//     );

//     res.status(201).json({ message: "Technician added successfully", technicianId: result.insertId });
//   } catch (error) {
//     console.error("Error adding technician:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// Update technician data
// const updateTechnician = async (req, res) => {
//   const { employee_id } = req.params;
//   const { name, email, phone, address, department, status } = req.body;

//   try {
//     const [result] = await pool.execute(
//       `UPDATE users
//        SET name = ?, email = ?, phone = ?, address = ?, department = ?, status = ?
//        WHERE employee_id = ? AND role = 'TECHNICIAN'`,
//       [name, email, phone, address, department, status, employee_id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Technician not found" });
//     }

//     res.json({ message: "Technician updated successfully" });
//   } catch (error) {
//     console.error("Error updating technician:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

//  Delete technician
// const deleteTechnician = async (req, res) => {
//   const { employee_id } = req.params;

//   try {
//     const [result] = await pool.execute(
//       `DELETE FROM users WHERE employee_id = ? AND role = 'TECHNICIAN'`,
//       [employee_id]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Technician not found" });
//     }

//     res.json({ message: "Technician deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting technician:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

module.exports = {
  getAllTechnicians,
  // addTechnician,
  // updateTechnician,
  // deleteTechnician,
};