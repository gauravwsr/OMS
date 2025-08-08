const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // Basic attendance information
    method: {
      type: String,
      enum: ["face_recognition", "manual", "qr_code", "biometric"],
      default: "manual",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },

    // Employee information
    employeeName: {
      type: String,
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeEmail: {
      type: String,
    },
    employeeRole: {
      type: String,
    },

    // Face recognition details (for face recognition attendance)
    confidence: {
      type: String,
    },
    recognizedName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Absent", "Early_Leave"],
      default: "Present",
    },

    // Detailed face recognition information
    faceRecognitionDetails: {
      server_response: {
        type: mongoose.Schema.Types.Mixed,
      },
      recognition_type: {
        type: String,
        enum: ["normal", "ambiguous_match_accepted", "low_confidence_accepted"],
        default: "normal",
      },
      confidence_value: {
        type: Number,
        min: 0,
        max: 100,
      },
      recognition_time: {
        type: Date,
      },
      system_version: {
        type: String,
        default: "1.0",
      },
      device_info: {
        type: String,
      },
      browser_info: {
        platform: String,
        language: String,
        cookieEnabled: Boolean,
      },
    },

    // Location and system information
    location: {
      type: String,
      default: "Office",
    },
    ip_address: {
      type: String,
    },
    system_info: {
      user_agent: String,
      screen_resolution: String,
      timezone: String,
    },

    // Geolocation (optional)
    geolocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },

    // Check-in/Check-out tracking
    attendance_type: {
      type: String,
      enum: ["check_in", "check_out", "break_start", "break_end"],
      default: "check_in",
    },

    // Additional metadata
    notes: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    verification_method: {
      type: String,
      enum: ["automatic", "manual_approval", "admin_override"],
      default: "automatic",
    },

    // Time validation and attendance rules
    isHalfDay: {
      type: Boolean,
      default: false,
    },
    isLateAttendance: {
      type: Boolean,
      default: false,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    checkInTimeCategory: {
      type: String,
      enum: ["on_time", "late", "very_late", "absent"],
      default: "on_time",
    },
    timeValidation: {
      currentTime: String,
      currentDateTime: String,
      isAllowed: Boolean,
      message: String,
      type: String,
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
    },

    // Extended metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Admin fields
    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin_notes: {
      type: String,
    },

    // Timestamps
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "attendance_records",
  }
);

// Indexes for better query performance
attendanceSchema.index({ employeeId: 1, timestamp: -1 });
attendanceSchema.index({ date: 1, employeeId: 1 });
attendanceSchema.index({ method: 1 });
attendanceSchema.index({ status: 1 });

// Virtual for getting formatted date
attendanceSchema.virtual("formattedDate").get(function () {
  return this.timestamp.toLocaleDateString();
});

// Virtual for getting formatted time
attendanceSchema.virtual("formattedTime").get(function () {
  return this.timestamp.toLocaleTimeString();
});

// Pre-save middleware to update timestamps and derived fields
attendanceSchema.pre("save", function (next) {
  this.updated_at = new Date();

  // Auto-populate date and time if not provided
  if (!this.date) {
    this.date = this.timestamp.toDateString();
  }
  if (!this.time) {
    this.time = this.timestamp.toLocaleTimeString();
  }

  next();
});

// Static method to get attendance for a specific date range
attendanceSchema.statics.getAttendanceByDateRange = function (
  employeeId,
  startDate,
  endDate
) {
  return this.find({
    employeeId: employeeId,
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ timestamp: -1 });
};

// Static method to get today's attendance for an employee
attendanceSchema.statics.getTodayAttendance = function (employeeId) {
  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  );

  return this.findOne({
    employeeId: employeeId,
    timestamp: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  }).sort({ timestamp: -1 });
};

// Instance method to check if attendance is late
attendanceSchema.methods.isLate = function (officeStartTime = "09:00") {
  const attendanceTime = this.timestamp.toTimeString().slice(0, 5);
  return attendanceTime > officeStartTime;
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
