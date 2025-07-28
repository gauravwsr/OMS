const express = require("express");
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  clearAllNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/auth");

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
router.get("/", protect, getNotifications);

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private
router.post("/", protect, createNotification);

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
router.patch("/:id/read", protect, markAsRead);

// @desc    Clear all notifications for user
// @route   DELETE /api/notifications/clear
// @access  Private
router.delete("/clear", protect, clearAllNotifications);

module.exports = router;
