const fs = require("fs"); // Regular fs module for synchronous methods
const fsp = require("fs").promises; // Promises-based fs module for asynchronous methods
const path = require("path");
const db = require("../config/sequelize"); // Use Sequelize configuration
require("dotenv").config();

const uploadReport = async (req, res) => {
  try {
    const { employeeId, report_type, report_subtype, uploaded_by, notes } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one file is required." });
    }

    // Validate required fields
    if (!employeeId || !report_type || !uploaded_by) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Check if employeeId exists in users or family_members table
    const userExists = await db.users.findOne({ where: { employee_id: employeeId } });
    const familyMemberExists = await db.family_members.findOne({ where: { dependent_id: employeeId } });

    if (!userExists && !familyMemberExists) {
      return res.status(400).json({ message: "Invalid employeeId or dependentId.", CODE : employeeId});
    }

    const uploadedReports = [];

    // Create destination directory if it doesn't exist
    const baseDir = process.env.REPORTS_DIR || 'D:/EHMS/Reports';
    const destDir = path.join(baseDir, employeeId, report_type);

    try {
      await fsp.mkdir(destDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directory:', err);
      return res.status(500).json({ message: "Failed to create destination directory." });
    }

    for (const file of req.files) {
      const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
      const fileExtension = path.extname(file.originalname);
      const fileName = `${employeeId}_${report_subtype}_${timestamp}${fileExtension}`;
      const destPath = path.join(destDir, fileName);

      try {
        // Check if the file exists before renaming
        const fileExists = await fsp.access(file.path).then(() => true).catch(() => false);
        if (!fileExists) {
          console.error(`File not found: ${file.path}`);
          return res.status(404).json({ message: `File not found: ${file.originalname}` });
        }

        // Rename the file
        await fsp.rename(file.path, destPath);

        const report = await db.reports_metadata.create({
          employee_id: employeeId,
          report_type,
          report_subtype,
          file_name: fileName,
          file_path: destPath,
          notes,
          uploaded_by,
        });

        uploadedReports.push(report);
      } catch (err) {
        console.error('Error processing file:', file.originalname, err);
        // Clean up if file operation fails
        try { await fsp.unlink(file.path); } catch (e) {}
        return res.status(500).json({ 
          message: `Failed to process file ${file.originalname}`,
          error: err.message 
        });
      }
    }

    res.status(201).json({ 
      success: true,
      message: "Reports uploaded successfully.",
      reports: uploadedReports 
    });
  } catch (error) {
    console.error("Error uploading reports:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to upload reports.",
      error: error.message 
    });
  }
};

const fetchReport = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    // Check if employeeId exists in users or family_members table
    const userExists = await db.users.findOne({ where: { employee_id: employeeId } });
    const familyMemberExists = await db.family_members.findOne({ where: { dependent_id: employeeId } });

    if (!userExists && !familyMemberExists) {
      return res.status(404).json({ 
        message: "Employee/Dependent not found",
        code: "USER_NOT_FOUND" 
      });
    }

    // Fetch reports for the given ID
    const reports = await db.reports_metadata.findAll({
      where: { employee_id: employeeId, is_deleted: false },
    });

    if (reports.length === 0) {
      return res.status(200).json({ 
        message: "No reports found for this employee/dependent",
        code: "NO_REPORTS",
        reports: [] 
      });
    }

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ 
      message: "Failed to fetch reports.", 
      error: error.message,
      code: "SERVER_ERROR"
    });
  }
};

const viewReport = async (req, res) => {
  try {
    const { reportId, employeeId } = req.params;

    if (!reportId || !employeeId) {
      return res.status(400).json({ message: "Report ID and Employee ID are required." });
    }

    // Fetch the report
    const report = await db.reports_metadata.findOne({
      where: { id: reportId, employee_id: employeeId, is_deleted: false },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    const absoluteFilePath = path.resolve(report.file_path); // Ensure the file path is absolute
    res.setHeader("Content-Disposition", "inline; filename=" + report.file_name);    
    res.sendFile(absoluteFilePath);
    } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Failed to fetch report.", error });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { deleted_by, delete_reason } = req.body;

    if (!reportId || !deleted_by || !delete_reason) {
      return res.status(400).json({ message: "Missing required fields: reportId, deleted_by, or delete_reason." });
    }

    const report = await db.reports_metadata.findOne({
      where: { id: reportId, is_deleted: false },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found or already deleted." });
    }

    // Soft delete the report
    await report.update({
      is_deleted: true,
      deleted_by,
      delete_reason,
      deleted_at: new Date(),
    });

    res.status(200).json({ message: "Report deleted successfully." });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Failed to delete report.", error });
  }
};

const fetchReportMetadata = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required." });
    }

    const report = await db.reports_metadata.findOne({
      where: { id: reportId },
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report metadata:", error);
    res.status(500).json({ message: "Failed to fetch report metadata.", error });
  }
};

module.exports = { uploadReport, fetchReport, viewReport, deleteReport, fetchReportMetadata };
