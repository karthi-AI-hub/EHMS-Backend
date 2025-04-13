const db = require("../config/sequelize");
const moment = require("moment");

const getAnalyticsData = async (req, res) => {
  try {
    // Current date calculations
    const todayStart = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
    const todayEnd = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
    
    // 1. Today's Reports Summary
    const todaysReports = await db.sequelize.query(
      `SELECT 
        report_type,
        COUNT(*) AS count,
        COUNT(DISTINCT employee_id) AS unique_patients
       FROM reports_metadata
       WHERE is_deleted = 0 
       AND uploaded_at BETWEEN ? AND ?
       GROUP BY report_type`,
      {
        replacements: [todayStart, todayEnd],
        type: db.sequelize.QueryTypes.SELECT
      }
    );

    // 2. Report Type Distribution with subtypes
    const reportTypeStats = await db.sequelize.query(
      `SELECT 
        report_type,
        report_subtype,
        COUNT(*) AS count,
        COUNT(DISTINCT employee_id) AS unique_patients
       FROM reports_metadata
       WHERE is_deleted = 0
       GROUP BY report_type, report_subtype
       ORDER BY report_type, count DESC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 3. Time-based Trends
    const twelveMonthsAgo = moment().subtract(12, "months").startOf("month").format("YYYY-MM-DD HH:mm:ss");
    const monthlyTrends = await db.sequelize.query(
      `SELECT 
        DATE_FORMAT(uploaded_at, '%Y-%m') AS month,
        COUNT(*) AS total_uploads,
        COUNT(DISTINCT employee_id) AS unique_patients,
        COUNT(DISTINCT uploaded_by) AS active_uploaders,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deletions
       FROM reports_metadata
       WHERE uploaded_at >= ?
       GROUP BY month
       ORDER BY month`,
      {
        replacements: [twelveMonthsAgo],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // 4. Daily Activity (last 30 days)
    const thirtyDaysAgo = moment().subtract(30, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const dailyActivity = await db.sequelize.query(
      `SELECT 
        DATE(uploaded_at) AS date,
        COUNT(*) AS uploads,
        SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) AS deletions
       FROM reports_metadata
       WHERE uploaded_at >= ?
       GROUP BY date
       ORDER BY date`,
      {
        replacements: [thirtyDaysAgo],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // 5. Top Contributors
    const topContributors = await db.sequelize.query(
      `SELECT 
        uploaded_by AS user_id,
        COUNT(*) AS report_count,
        COUNT(DISTINCT employee_id) AS unique_patients,
        COUNT(DISTINCT report_type) AS report_types_uploaded
       FROM reports_metadata
       WHERE is_deleted = 0
       GROUP BY uploaded_by
       ORDER BY report_count DESC
       LIMIT 10`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 6. Recent Activity with deletion info
    const recentActivity = await db.sequelize.query(
      `SELECT 
        id,
        file_name AS report_name,
        report_type,
        report_subtype,
        uploaded_at,
        uploaded_by AS user_id,
        is_deleted,
        deleted_by,
        deleted_at
       FROM reports_metadata
       ORDER BY uploaded_at DESC
       LIMIT 10`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 7. Deletion Analysis
    const deletionAnalysis = await db.sequelize.query(
      `SELECT 
        report_type,
        deleted_by,
        COUNT(*) AS total_deleted,
        AVG(TIMESTAMPDIFF(HOUR, uploaded_at, deleted_at)) AS avg_hours_before_deletion,
        MAX(TIMESTAMPDIFF(HOUR, uploaded_at, deleted_at)) AS max_hours_before_deletion,
        MIN(TIMESTAMPDIFF(HOUR, uploaded_at, deleted_at)) AS min_hours_before_deletion
       FROM reports_metadata
       WHERE is_deleted = 1
       GROUP BY report_type, deleted_by
       ORDER BY total_deleted DESC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // 8. Report Type Growth (weekly)
    const reportTypeGrowth = await db.sequelize.query(
      `SELECT 
        report_type,
        YEARWEEK(uploaded_at, 3) AS week,
        COUNT(*) AS count
       FROM reports_metadata
       WHERE is_deleted = 0 AND uploaded_at >= ?
       GROUP BY report_type, week
       ORDER BY week, report_type`,
      {
        replacements: [twelveMonthsAgo],
        type: db.sequelize.QueryTypes.SELECT,
      }
    );

    // Calculate summary statistics
    const summaryStats = {
      totalReports: await db.sequelize.query(
        `SELECT COUNT(*) AS count FROM reports_metadata WHERE is_deleted = 0`,
        { type: db.sequelize.QueryTypes.SELECT }
      ).then(result => result[0].count),
      totalUniquePatients: await db.sequelize.query(
        `SELECT COUNT(DISTINCT employee_id) AS count FROM reports_metadata WHERE is_deleted = 0`,
        { type: db.sequelize.QueryTypes.SELECT }
      ).then(result => result[0].count),
      todaysUploads: todaysReports.reduce((sum, item) => sum + item.count, 0),
      todaysUniquePatients: todaysReports.reduce((sum, item) => sum + item.unique_patients, 0),
      deletionRate: await db.sequelize.query(
        `SELECT 
          (SUM(CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100 AS rate 
         FROM reports_metadata`,
        { type: db.sequelize.QueryTypes.SELECT }
      ).then(result => result[0].rate),
      avgMonthlyUploads: monthlyTrends.reduce((sum, item) => sum + item.total_uploads, 0) / (monthlyTrends.length || 1),
    };

    res.status(200).json({
      todaysReports: todaysReports || [],
      reportTypeStats: reportTypeStats || [],
      monthlyTrends: monthlyTrends || [],
      dailyActivity: dailyActivity || [],
      topContributors: topContributors || [],
      recentActivity: recentActivity || [],
      deletionAnalysis: deletionAnalysis || [],
      reportTypeGrowth: reportTypeGrowth || [],
      summaryStats: summaryStats || {
        totalReports: 0,
        totalUniquePatients: 0,
        todaysUploads: 0,
        todaysUniquePatients: 0,
        deletionRate: 0,
        avgMonthlyUploads: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({
      message: "Failed to fetch analytics data.",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

module.exports = { getAnalyticsData };