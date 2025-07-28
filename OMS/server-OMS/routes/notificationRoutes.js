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

// @desc    Clean up test notifications (keep only real HR events)
// @route   DELETE /api/notifications/cleanup-test
// @access  Private
router.delete("/cleanup-test", protect, async (req, res) => {
  try {
    const Notification = require("../models/notificationModel");
    
    // Remove notifications with "Test" in the title or message, or created by Nayan Nikhare
    const result = await Notification.deleteMany({
      $or: [
        { title: { $regex: /test/i } },
        { message: { $regex: /test/i } },
        { message: { $regex: /verify notification system/i } },
        { createdByName: "Nayan Nikhare" },
        { createdByName: { $regex: /test/i } }
      ]
    });
    
    console.log(`Cleaned up ${result.deletedCount} test notifications`);
    
    res.status(200).json({
      success: true,
      message: `Cleaned up ${result.deletedCount} test notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("Error cleaning up test notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up test notifications",
      error: error.message
    });
  }
});

module.exports = router;
