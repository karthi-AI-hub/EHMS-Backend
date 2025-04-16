const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const employeeRoutes = require("./src/routes/employeeRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const instructionRoutes = require("./src/routes/instructionRoutes");
const allergyRoutes = require("./src/routes/allergyRoutes");
const conditionRoutes = require("./src/routes/conditionRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const technicianRoutes = require("./src/routes/technicianRoutes");
const pool = require("./src/config/db");
const { syncModels } = require("./src/config/sequelize");
const { getAllEmployees ,getAccess} = require("./src/controllers/employeeController");
const { authenticate, authorizeRoles } = require("./src/middlewares/authMiddleware");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for testing; restrict in production
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
    path: "/ehms/api/socket.io", // Ensure this matches the frontend configuration
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO setup
app.set("io", io);

// Routes
app.use("/api/allemployees",
    authenticate,
    authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
    getAllEmployees
);

app.get(
  '/api/checkAccess',
  authenticate,
  authorizeRoles("Technician", "Admin", "Doctor", "Employee"),
  getAccess,
)
app.use("/api/employee", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/instructions", instructionRoutes);
app.use("/api/allergies", allergyRoutes);
app.use("/api/conditions", conditionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/technicians", technicianRoutes);

// Ensure the temp directory exists
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log("✅ Temp directory created:", tempDir);
}

// MySQL Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
    } else {
        console.log("✅ MySQL Connected");
        connection.release();
    }
});

// Sync Sequelize models
syncModels(); // Use the syncModels function from sequelize.js

// Socket.IO events
io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
    });
});

// Error-handling middleware
app.use((err, req, res, next) => {
    console.error("Error-handling middleware triggered:", err.stack);
    res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});
// Add this at the top of your routes or server file
app.get('/', (req, res) => {
    res.send('Backend is up and running!');
  });  

// Start the server
const PORT = process.env.PORT;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { io };