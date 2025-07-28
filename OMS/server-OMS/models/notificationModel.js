const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['event', 'meeting', 'general'],
    default: 'general',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdByName: {
    type: String,
    required: true,
  },
  targetRoles: [{
    type: String,
    enum: ['Super_Admin', 'Admin', 'HR_Manager', 'Employee'],
  }],
  isRead: {
    type: Boolean,
    default: false,
  },
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    readAt: {
      type: Date,
      default: Date.now,
    }
  }],
  eventData: {
    eventId: String,
    eventTitle: String,
    eventDate: Date,
    location: String,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Notifications expire after 30 days
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
});

// Index for automatic deletion of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for efficient querying
notificationSchema.index({ targetRoles: 1, createdAt: -1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
