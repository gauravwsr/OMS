require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");

// Set default JWT secret if not in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your-secret-key-for-oms-application-2024";
}

console.log("JWT_SECRET configured:", process.env.JWT_SECRET ? "Yes" : "No");

// Import configurations and middlewares
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/errorMiddleware");

// Import socket configuration
const chatSocket = require("./socket/chatSocket");

// Import route handlers
const candidateRoutes = require("./routes/candidateRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require("./routes/chatRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const calenderRoutes = require("./routes/calenderRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const activityRoutes = require("./routes/activityRoutes");
const projectRoutes = require("./routes/projectRoutes");
const clientProjectRoutes = require("./routes/clientProjectRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const hrLeaveRoutes = require("./routes/hrLeaveRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const attendanceTimeValidationRoutes = require("./routes/attendanceTimeValidationRoutes");
const teamLeadTaskRoutes = require("./routes/teamLeadTaskRoutes");
const employeeTaskRoutes = require("./routes/employeeTaskRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const completionRoutes = require("./routes/completionRoutes");
const offerRoutes = require("./routes/offerRoutes");

// Import models for cleanup
const ScheduleEventData = require("./models/calenderModel");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
chatSocket.init(server);

// Make io accessible in routes
app.set("io", chatSocket.getIO());

// CORS request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} request for ${req.url} from origin ${req.headers.origin}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
  }
  next();
});

// Apply CORS middleware BEFORE routes
app.use(
  cors({
    origin: [
      "http://http://134.199.170.166:3000",
      "http://localhost:3001",
      "http://146.190.165.62:5002",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length", "X-Requested-With", "Access-Control-Allow-Origin"],
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

// Additional CORS headers for extra security
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Pre-flight requests handling
app.options("*", cors());

// Apply body parsing middleware BEFORE routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional middleware to log parsed body for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Parsed request body:', req.body);
  }
  next();
});

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to Database
connectDB();

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Route handlers
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/users", userRoutes);
app.use(userRoutes);
app.use("/tasks", taskRoutes);
app.use("/", calenderRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api", projectRoutes);
app.use("/api/client-projects", clientProjectRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/hr-leave", hrLeaveRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/attendance", attendanceRoutes);

// Attendance time validation testing routes
app.use("/api/attendance-validation", attendanceTimeValidationRoutes);

// Direct route for registered users (for backward compatibility)
const { getRegisteredUsersAPI } = require("./controllers/attendanceController");
app.get("/api/registered-users", getRegisteredUsersAPI);

// Notification routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/team-lead", teamLeadTaskRoutes);
app.use("/api/employee", employeeTaskRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/completions", completionRoutes);
app.use("/api/offers", offerRoutes);

// Uncomment these routes if needed
// app.use("/api", trackingRoutes);
// app.use("/api", activityRoutes);

// General health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Check database connectivity
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? "connected" : "disconnected";

    res.status(200).json({
      status: "healthy",
      service: "oms-backend",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        state: dbState,
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "oms-backend",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Error Handling Middleware
app.use(errorHandler);

// Error handling for uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

const port = process.env.PORT || 5000;

server.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(
    `✅ CORS enabled for origins: ${JSON.stringify([
      "http://http://134.199.170.166:3000",
      "http://localhost:3001",
      "http://146.190.165.62:5002",
    ])}`
  );
  console.log(`📝 API endpoints ready at http://localhost:${port}/api/`);
  
  // Verify server is actually listening
  setTimeout(() => {
    const http = require('http');
    http.get(`http://localhost:${port}/api/health`, (res) => {
      console.log('✅ Server health check passed');
    }).on('error', (err) => {
      console.error('❌ Server health check failed:', err.message);
    });
  }, 1000);
});

// Automatic cleanup function for finished events
const cleanupFinishedEvents = async () => {
  try {
    const now = new Date();
    const result = await ScheduleEventData.deleteMany({
      EndTime: { $lt: now },
    });

    if (result.deletedCount > 0) {
      console.log(
        `🧹 Auto-cleanup: Removed ${
          result.deletedCount
        } finished events at ${now.toLocaleString()}`
      );
    }
  } catch (error) {
    console.error("❌ Error during auto-cleanup:", error);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupFinishedEvents, 30 * 60 * 1000);

// Run initial cleanup on server start
cleanupFinishedEvents();
