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
<<<<<<< HEAD
=======
const noteRoutes = require("./routes/noteRoutes");
const path = require("path");
>>>>>>> 8ee10ddd9a1f290ca2c40b979ec760259d1a3a05
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
const teamLeadTaskRoutes = require("./routes/teamLeadTaskRoutes");
const employeeTaskRoutes = require("./routes/employeeTaskRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const completionRoutes = require("./routes/completionRoutes");
const offerRoutes = require("./routes/offerRoutes");
const chargeHandoverRoutes = require("./routes/chargeHandoverRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

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
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5002",
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

<<<<<<< HEAD
=======
// Chat and message routes (after CORS middleware)
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

>>>>>>> 8ee10ddd9a1f290ca2c40b979ec760259d1a3a05
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
<<<<<<< HEAD
app.use(userRoutes);
=======
app.use("/api", userRoutes);

// Note routes
app.use("/api", noteRoutes);

// Other routes
>>>>>>> 8ee10ddd9a1f290ca2c40b979ec760259d1a3a05
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
<<<<<<< HEAD
=======

// Direct route for registered users (for backward compatibility)
const { getRegisteredUsersAPI } = require("./controllers/attendanceController");
app.get("/api/registered-users", getRegisteredUsersAPI);

// Notification routes
>>>>>>> 8ee10ddd9a1f290ca2c40b979ec760259d1a3a05
app.use("/api/notifications", notificationRoutes);
app.use("/api/team-lead", teamLeadTaskRoutes);
app.use("/api/employee", employeeTaskRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/completions", completionRoutes);
app.use("/api/offers", offerRoutes);

<<<<<<< HEAD
// Uncomment these routes if needed
=======
// Email management routes
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
>>>>>>> 8ee10ddd9a1f290ca2c40b979ec760259d1a3a05
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

<<<<<<< HEAD
const port = process.env.PORT || 5000;

server.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
=======
// Send Email Route
app.post("/api/send-email", upload.single("attachment"), async (req, res) => {
  const { email, subject, body } = req.body;
  const file = req.file;

  if (!email || !subject || !body) {
    return res
      .status(400)
      .send({ message: "Recipient email, subject, and body are required" });
  }

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: subject,
    text: body,
    attachments: file ? [{ filename: file.originalname, path: file.path }] : [],
  };

  let newEmail;

  try {
    // Save email details to the database with status 'draft'
    console.log("Saving email details to the database...");
    newEmail = new Email({
      from: process.env.SMTP_USER,
      to: email,
      subject: subject,
      body: body,
      attachments: file ? [file.path] : [],
      status: "draft",
    });
    await newEmail.save();
    console.log("Email details saved to the database.");

    // Send the email
    console.log("Sending email...");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info);

    // Update email status to 'sent' after successful sending
    newEmail.status = "sent";
    await newEmail.save();

    if (file) {
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });
    }

    res.status(200).send({ message: "Email sent successfully!", info });
  } catch (error) {
    console.error("Error sending email:", error);

    // Update email status to 'draft' if sending fails
    if (newEmail) {
      await Email.findByIdAndUpdate(newEmail._id, { status: "draft" });
    }

    res
      .status(500)
      .send({ message: "Error sending email", error: error.message });
  }
});

// Fetch Drafts Route
app.get("/fetch-drafts", async (req, res) => {
  try {
    const drafts = await Draft.find();
    res.status(200).json(drafts);
  } catch (err) {
    console.error("Error fetching drafts:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch Sent Emails API
app.get("/fetch-sent-emails", async (req, res) => {
  try {
    const sentEmails = await Email.find({ status: "sent" }).sort({ date: -1 });
    res.status(200).send({ emails: sentEmails });
  } catch (err) {
    console.error("Error fetching sent emails:", err);
    res
      .status(500)
      .send({ message: "Error fetching sent emails", error: err.message });
  }
});

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
>>>>>>> 8ee10ddd9a1f290ca2c40b979ec760259d1a3a05
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(
    `✅ CORS enabled for origins: ${JSON.stringify([
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5002",
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
