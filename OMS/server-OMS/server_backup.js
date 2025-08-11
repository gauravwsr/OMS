require("dotenv").config(); // Load environment variables
const express = require("express");

// Set default JWT secret if not in environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "your-secret-key-for-oms-application-2024";
}

console.log("JWT_SECRET configured:", process.env.JWT_SECRET ? "Yes" : "No");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const chatSocket = require("./socket/chatSocket");
const candidateRoutes = require("./routes/candidateRoutes");
const messageRoutes = require("./routes/messageRoutes");
const chatRoutes = require("./routes/chatRoutes");
const connectDB = require("./config/db");
const trackingRoutes = require("./routes/trackingRoutes");
const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const noteRoutes = require("./routes/noteRoutes");
const path = require("path");
const calenderRoutes = require("./routes/calenderRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const scheduleRoutes = require("./routes/scheduleRoutes");
// const candidateRoutes = require('./routes/candidateRoutes');
const activityRoutes = require("./routes/activityRoutes");
const projectRoutes = require("./routes/projectRoutes");
const clientProjectRoutes = require("./routes/clientProjectRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const ScheduleEventData = require("./models/calenderModel"); // Add this for cleanup
const hrLeaveRoutes = require("./routes/hrLeaveRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const teamLeadTaskRoutes = require("./routes/teamLeadTaskRoutes");
const employeeTaskRoutes = require("./routes/employeeTaskRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const completionRoutes = require("./routes/completionRoutes");
const offerRoutes = require("./routes/offerRoutes");
const chargeHandoverRoutes = require("./routes/chargeHandoverRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

const app = express();
const server = http.createServer(app);
// Initialize Socket.io
chatSocket.init(server);

// Make io accessible in routes
app.set("io", chatSocket.getIO());

// CORS request logging middleware for debugging
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} request for ${
      req.url
    } from origin ${req.headers.origin}`
  );
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Request body:", req.body);
    console.log("Content-Type:", req.headers["content-type"]);
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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "X-Requested-With",
      "Pragma",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "Content-Length",
      "X-Requested-With",
      "Access-Control-Allow-Origin",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Additional CORS headers for extra security
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});

// Pre-flight requests handling
app.options("*", cors());

// Apply body parsing middleware BEFORE routes
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Additional middleware to log parsed body for debugging
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Parsed request body:", req.body);
  }
  next();
});

// Chat and message routes (after CORS middleware)
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to Database
connectDB();

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Authentication routes
app.use("/api/auth", authRoutes);

// User routes
app.use("/users", userRoutes);
app.use("/api", userRoutes);

// Note routes
app.use("/api", noteRoutes);

// Other routes
app.use("/tasks", taskRoutes);
app.use("/", calenderRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api", projectRoutes);

// Client Project management routes
app.use("/api/client-projects", clientProjectRoutes);

// Leave management routes
app.use("/api/leave", leaveRoutes);

// HR Leave management routes
app.use("/api/hr-leave", hrLeaveRoutes);

// Analytics routes
app.use("/api/analytics", analyticsRoutes);

// Attendance routes
app.use("/api/attendance", attendanceRoutes);

// Direct route for registered users (for backward compatibility)
const { getRegisteredUsersAPI } = require("./controllers/attendanceController");
app.get("/api/registered-users", getRegisteredUsersAPI);

// Notification routes
app.use("/api/notifications", notificationRoutes);

// Team Lead Task management routes
app.use("/api/team-lead", teamLeadTaskRoutes);

// Employee Task management routes
app.use("/api/employee", employeeTaskRoutes);

// Email routes (user-specific)
app.use("/api/emails", emailRoutes);

// Certificate management routes
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use("/api/completions", require("./routes/completionRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));

// Charge Handover routes
app.use("/api/charge-handovers", chargeHandoverRoutes);

// Meeting routes (role-based video conferencing)
app.use("/api/meetings", meetingRoutes);

// mouse tracking
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

// Temporary in-memory storage for chat messages
const messages = [];

// Email Schema
const emailSchema = new mongoose.Schema({
  from: String,
  to: String,
  subject: String,
  body: String,
  attachments: [String],
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["sent", "inbox", "draft"], default: "sent" },
});

const Email = mongoose.model("Email", emailSchema);

// Draft Schema
const DraftSchema = new mongoose.Schema({
  to: { type: String, required: false },
  subject: { type: String, required: false },
  body: { type: String, required: false },
  date: { type: Date, default: Date.now },
});

const Draft = mongoose.model("Draft", DraftSchema);

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// In-memory storage for sent emails
const sentEmails = [];

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// IMAP Configuration (commented out to prevent connection errors)
// Only enable if IMAP credentials are properly configured
const imap = new Imap({
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASS,
  host: process.env.IMAP_HOST,
  port: process.env.IMAP_PORT,
  tls: true,
  timeout: 30000,
  authTimeout: 30000, // Authentication timeout
});

// Function to connect IMAP (only call when needed)
function connectImap() {
  // Only connect if IMAP credentials are available
  if (process.env.IMAP_USER && process.env.IMAP_PASS && process.env.IMAP_HOST) {
    console.log("Attempting IMAP connection...");
    imap.connect();
  } else {
    console.log("IMAP credentials not configured, skipping IMAP connection");
  }
}

imap.on("error", (err) => {
  console.error("IMAP error:", err);
  // Don't automatically reconnect to prevent infinite timeout loops
  // setTimeout(connectImap, 5000);
});

imap.on("end", () => {
  console.log("IMAP connection ended.");
  // Don't automatically reconnect to prevent infinite timeout loops
  // setTimeout(connectImap, 5000);
});

// Don't automatically connect IMAP on server start
// connectImap();

// Error handling for uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  // Don't exit the process for IMAP-related errors
  if (!err.message?.includes('IMAP') && !err.message?.includes('timeout')) {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection:", reason);
  // Don't exit the process for IMAP-related errors
  if (!reason?.message?.includes('IMAP') && !reason?.message?.includes('timeout')) {
    process.exit(1);
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT. Graceful shutdown...");
  server.close(() => {
    console.log("HTTP server closed.");
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
});

// Start the server
//     console.error("Error fetching sent emails:", err);
//     res
//       .status(500)
//       .send({ message: "Error fetching sent emails", error: err.message });
//   }
// });

// Fetch Inbox Emails API
app.get("/fetch-inbox-emails", async (req, res) => {
  // Check if IMAP is configured
  if (!process.env.IMAP_USER || !process.env.IMAP_PASS || !process.env.IMAP_HOST) {
    return res.status(200).send({ 
      emails: [], 
      message: "IMAP not configured. No inbox emails available." 
    });
  }

  const emails = [];

  try {
    await new Promise((resolve, reject) => {
      // Set a timeout for the entire operation
      const operationTimeout = setTimeout(() => {
        reject(new Error("IMAP operation timed out"));
      }, 10000); // 10 second timeout

      imap.once("ready", () => {
        clearTimeout(operationTimeout);
        const folderToOpen = "INBOX";

        imap.openBox(folderToOpen, true, (err, box) => {
          if (err)
            return reject(
              new Error(`Error opening folder '${folderToOpen}': ${err.message}`)
            );

          imap.search(["ALL"], (err, results) => {
            if (err)
              return reject(
                new Error(`Error searching emails: ${err.message}`)
              );

            if (results.length === 0) {
              console.log(`No emails found in folder '${folderToOpen}'.`);
              return resolve();
            }

            const fetcher = imap.fetch(results.reverse(), { bodies: "" });

            fetcher.on("message", (msg) => {
              msg.on("body", (stream) => {
                simpleParser(stream, (err, parsed) => {
                  if (err)
                    return console.error("Error parsing email:", err.message);

                  if (parsed?.from?.text && parsed.subject && parsed.date) {
                    emails.push({
                      from: parsed.from.text,
                      subject: parsed.subject,
                      date: parsed.date,
                      body: parsed.text,
                    });
                  }
                });
              });
            });

            fetcher.once("end", () => {
              console.log(
                `Finished fetching emails from folder '${folderToOpen}'.`
              );
              resolve();
            });
          });
        });
      });

      imap.once("error", (err) => {
        clearTimeout(operationTimeout);
        reject(new Error(`IMAP connection error: ${err.message}`));
      });
      
      imap.once("end", () => {
        clearTimeout(operationTimeout);
        console.log("IMAP connection closed.");
      });
      
      // Only try to connect if not already connected
      if (imap.state !== 'authenticated') {
        connectImap();
      }
    });

    emails.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).send({ emails });
  } catch (err) {
    console.error("Error fetching inbox emails:", err);
    // Return empty array instead of error for better UX
    res.status(200).send({ 
      emails: [], 
      message: "Could not fetch inbox emails. IMAP service may be unavailable.",
      error: err.message 
    });
  }
});

// Error Handling
app.use(errorHandler);

// Connect to MongoDB
// mongoose.connect('mongodb://localhost27017/projectdb', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
const port = process.env.PORT || 5001;

server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(
    `✅ CORS enabled for origins: ${JSON.stringify([
      "http://http://134.199.170.166:3000",
      "http://localhost:3001",
      "http://146.190.165.62:5002",
    ])}`
  );
  console.log(`📝 API endpoints ready at http://localhost:${port}/api/`);
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
