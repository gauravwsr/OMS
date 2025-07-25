require("dotenv").config(); // Load environment variables
const express = require("express");
const Imap = require("node-imap");
const { simpleParser } = require("mailparser");
const multer = require("multer");
const fs = require("fs");
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
// const emailRoutes = require("./routes/emailRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const path = require("path");
const calenderRoutes = require("./routes/calenderRoutes");
const errorHandler = require("./middlewares/errorMiddleware");
const scheduleRoutes = require("./routes/scheduleRoutes");
// const candidateRoutes = require('./routes/candidateRoutes');
const activityRoutes = require("./routes/activityRoutes");
const projectRoutes = require("./routes/projectRoutes");
const leaveRoutes = require("./routes/leaveRoutes");

const app = express();
const server = http.createServer(app);
// Initialize Socket.io
chatSocket.init(server);

// Make io accessible in routes
app.set("io", chatSocket.getIO());

// Then your routes
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// });
// require('./socket/socketHandler')(io);

// Middleware

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Pre-flight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/candidates", candidateRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Middleware
app.use(express.json());

// Connect to Database
connectDB();

app.use("/api/auth", authRoutes);

// Routes
app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);
app.use(userRoutes);
app.use("/", calenderRoutes);
app.use("/api/schedule", scheduleRoutes);
// app.use('/api/candidates', candidateRoutes);

app.use("/api", projectRoutes);

// Leave management routes
app.use("/api/leave", leaveRoutes);

// mouse tracking
// app.use("/api", trackingRoutes);
// app.use("/api", activityRoutes);

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

// IMAP Configuration
const imap = new Imap({
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASS,
  host: process.env.IMAP_HOST,
  port: process.env.IMAP_PORT,
  tls: true,
  timeout: 30000,
  authTimeout: 30000, // Authentication timeout
});

// Function to connect IMAP
function connectImap() {
  imap.connect();
}

imap.on("error", (err) => {
  console.error("IMAP error:", err);
  // Attempt to reconnect after a delay
  setTimeout(connectImap, 5000);
});

imap.on("end", () => {
  console.log("IMAP connection ended. Reconnecting...");
  setTimeout(connectImap, 5000);
});

// Initial connection
connectImap();

// Error handling for uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection:", reason);
});

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
  const emails = [];

  try {
    await new Promise((resolve, reject) => {
      imap.once("ready", () => {
        const folderToOpen = "INBOX";

        imap.openBox(folderToOpen, true, (err, box) => {
          if (err)
            return reject(
              `new Error(Error opening folder '${folderToOpen}': ${err.message})`
            );

          imap.search(["ALL"], (err, results) => {
            if (err)
              return reject(
                `new Error(Error searching emails: ${err.message})`
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

      imap.once("error", (err) =>
        reject(new Error(`IMAP connection error: ${err.message}`))
      );
      imap.once("end", () => console.log("IMAP connection closed."));
      imap.connect();
    });

    emails.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).send({ emails });
  } catch (err) {
    console.error("Error fetching inbox emails:", err);
    res
      .status(500)
      .send({ message: "Error fetching inbox emails", error: err.message });
  }
});

// Socket.io Integration
// require('./socket/socketHandler')(io);

// Make Socket Available in Routes
// app.use((req, res, next) => {
//   req.io = io;
//   next();
// });

// app.use('/api/messages', messageRoutes);

// Error Handling
app.use(errorHandler);

const port = process.env.PORT || 5000;

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/projectdb', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
