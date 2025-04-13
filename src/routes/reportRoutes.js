const express = require("express");
const multer = require("multer");
const fs = require("fs");
const fsp = require("fs").promises; // Import fs.promises and assign it to fsp
const { uploadReport, fetchReport, viewReport, deleteReport, fetchReportMetadata } = require("../controllers/reportController");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = process.env.TEMP_DIR || './temp';
        // Ensure temp directory exists
        fs.mkdirSync(tempDir, { recursive: true });
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}_${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit per file
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed."));
        }
        cb(null, true);
    },
}).array("files", 10); // Allow up to 10 files

// Middleware to clean up temp files
const cleanupFiles = async (req, res, next) => {
    try {
        if (req.files) {
            await Promise.all(
                req.files.map(file =>
                    fsp.unlink(file.path).catch(e => console.error('Cleanup error:', e))
                )
            );
        }
        next();
    } catch (err) {
        console.error('Cleanup failed:', err);
        next();
    }
};

router.post(
    "/upload",
    upload, // Multer middleware must come first to process the files
    authenticate,
    authorizeRoles("Technician"),
    uploadReport, // Process the uploaded files first
    cleanupFiles // Cleanup middleware should come after uploadReport
);

router.get(
    "/:employeeId",
    authenticate,
    authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
    fetchReport,
);

router.get(
    "/view/:reportId/:employeeId",
    authenticate,
    authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
    viewReport,
);

router.get(
    "/metadata/:reportId",
    authenticate,
    authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
    fetchReportMetadata
);

router.delete(
    "/delete/:reportId",
    authenticate,
    authorizeRoles("Technician", "Admin"),
    deleteReport,
);

module.exports = router;