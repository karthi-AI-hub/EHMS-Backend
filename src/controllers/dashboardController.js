const db = require("../config/sequelize");
const { Op } = require("sequelize");

const getAdminDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalEmployees,
      totalDoctors,
      totalTechnicians,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      monthlyReportUploads,
    ] = await Promise.all([
      db.users.count(),
      db.users.count({ where: { role: "DOCTOR" } }),
      db.users.count({ where: { role: "TECHNICIAN" } }),
      db.reports_metadata.count({ where: { uploaded_at: { [Op.gte]: startOfDay } } }),
      db.reports_metadata.count({ where: { uploaded_at: { [Op.gte]: startOfWeek } } }),
      db.reports_metadata.count({ where: { uploaded_at: { [Op.gte]: startOfMonth } } }),
      db.sequelize.query(
        `
        SELECT DATE_FORMAT(uploaded_at, '%Y-%m') AS month, COUNT(*) AS count
        FROM reports_metadata
        WHERE is_deleted = 0
        GROUP BY month
        ORDER BY month
        `,
        { type: db.sequelize.QueryTypes.SELECT }
      ),
    ]);

    const months = monthlyReportUploads.map((data) => data.month);
    const counts = monthlyReportUploads.map((data) => data.count);

    res.status(200).json({
      totalEmployees,
      totalDoctors,
      totalTechnicians,
      reportsToday,
      reportsThisWeek,
      reportsThisMonth,
      months,
      monthlyReportUploads: counts,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch admin dashboard stats." });
  }
};

const getEmployeeDashboardStats = async (req, res) => {
  let { employee_id } = req.user;
  if(!employee_id) {
    employee_id = "L100001";
    }
  try {
    const myReports = await db.reports_metadata.count({
      where: { employee_id },
    });

    const dependentReports = await db.reports_metadata.count({
      where: {
        employee_id: {
          [Op.in]: db.sequelize.literal(
            `(SELECT dependent_id FROM family_members WHERE employee_id = '${employee_id}')`
          ),
        },
      },
    });

    res.status(200).json({ myReports, dependentReports });
  } catch (error) {
    console.error("Error fetching employee dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch employee dashboard stats." });
  }
};

module.exports = { getAdminDashboardStats, getEmployeeDashboardStats };