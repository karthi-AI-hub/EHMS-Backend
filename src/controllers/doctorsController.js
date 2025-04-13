const db = require("../config/sequelize");

// Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await db.users.findAll({
      where: { role: "DOCTOR" },
      attributes: [
        "employee_id",
        "name",
        "email",
        "phone",
        "address",
        "department",
        "status",
        "role",
        "created_at",
      ],
    });

    if (doctors.length === 0) {
      return res.status(404).json({ error: "No doctors found" });
    }

    res.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add a new doctor
// const addDoctor = async (req, res) => {
//   const { employee_id, name, email, phone, address, department, status } = req.body;

//   try {
//     const newDoctor = await db.users.create({
//       employee_id,
//       name,
//       email,
//       phone,
//       address,
//       department,
//       role: "DOCTOR",
//       status: status || "active",
//       password: employee_id ,
//     });

//     res.status(201).json({ message: "Doctor added successfully", doctor: newDoctor });
//   } catch (error) {
//     console.error("Error adding doctor:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// Update doctor details
// const updateDoctor = async (req, res) => {
//   const { employee_id } = req.params;
//   const { name, email, phone, address, department, status } = req.body;

//   try {
//     const doctor = await db.users.findOne({ where: { employee_id, role: "DOCTOR" } });

//     if (!doctor) {
//       return res.status(404).json({ error: "Doctor not found" });
//     }

//     await doctor.update({ name, email, phone, address, department, status });

//     res.json({ message: "Doctor updated successfully", doctor });
//   } catch (error) {
//     console.error("Error updating doctor:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// Delete a doctor
// const deleteDoctor = async (req, res) => {
//   const { employee_id } = req.params;

//   try {
//     const doctor = await db.users.findOne({ where: { employee_id, role: "DOCTOR" } });

//     if (!doctor) {
//       return res.status(404).json({ error: "Doctor not found" });
//     }

//     await doctor.destroy();

//     res.json({ message: "Doctor deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting doctor:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// Update doctor status
// const updateDoctorStatus = async (req, res) => {
//   const { employee_id } = req.params;
//   const { status } = req.body;

//   try {
//     const doctor = await db.users.findOne({ where: { employee_id, role: "DOCTOR" } });

//     if (!doctor) {
//       return res.status(404).json({ error: "Doctor not found" });
//     }

//     await doctor.update({ status });

//     res.json({ message: "Doctor status updated successfully", doctor });
//   } catch (error) {
//     console.error("Error updating doctor status:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

module.exports = {
  getAllDoctors,
//   addDoctor,
  // updateDoctor,
  // deleteDoctor,
//   updateDoctorStatus,
};