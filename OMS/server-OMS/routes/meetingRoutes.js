const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createMeeting,
  joinMeeting,
  getUserMeetings,
  endMeeting,
  leaveMeeting,
  getMeetingDetails,
  inviteUsersToMeeting,
  getDetailedAnalytics,
  exportAnalytics,
  scheduleMeeting,
  getUpcomingMeetings,
  startScheduledMeeting,
  getAnalyticsOverview,
} = require("../controllers/meetingController");

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @route   POST /api/meetings/create
 * @desc    Create a new meeting room
 * @access  Private (All except Intern)
 * @body    { roomName, roomType, teamName, inviteUserIds, meetingSettings }
 */
router.post("/create", createMeeting);

/**
 * @route   POST /api/meetings/join
 * @desc    Join a meeting room
 * @access  Private (Role-based restrictions apply)
 * @body    { roomId, inviteToken }
 */
router.post("/join", joinMeeting);

/**
 * @route   GET /api/meetings/list
 * @desc    Get list of meetings user can access
 * @access  Private (Role-based filtering)
 */
router.get("/list", getUserMeetings);

/**
 * @route   GET /api/meetings/:roomId
 * @desc    Get meeting details
 * @access  Private (Role-based access)
 */
router.get("/:roomId", getMeetingDetails);

/**
 * @route   PUT /api/meetings/:roomId/end
 * @desc    End a meeting
 * @access  Private (Creator or Admin only)
 */
router.put("/:roomId/end", endMeeting);

/**
 * @route   PUT /api/meetings/:roomId/leave
 * @desc    Leave a meeting
 * @access  Private
 */
router.put("/:roomId/leave", leaveMeeting);

/**
 * @route   POST /api/meetings/:roomId/invite
 * @desc    Invite users to a meeting
 * @access  Private (Creator or Admin only)
 * @body    { userIds }
 */
router.post("/:roomId/invite", inviteUsersToMeeting);

/**
 * @route   GET /api/meetings/analytics/detailed
 * @desc    Get detailed analytics with charts and metrics
 * @access  Private (Super_Admin or HR Manager only)
 * @query   { range, team }
 */
router.get("/analytics/detailed", getDetailedAnalytics);

/**
 * @route   GET /api/meetings/analytics/export
 * @desc    Export analytics data to Excel
 * @access  Private (Super_Admin or HR Manager only)
 * @query   { range, team, format }
 */
router.get("/analytics/export", exportAnalytics);

/**
 * @route   POST /api/meetings/schedule
 * @desc    Schedule a meeting for future date/time
 * @access  Private (All except Intern)
 * @body    { meetingName, roomType, teamName, description, scheduledAt, duration, emailReminder, reminderMinutes, meetingSettings }
 */
router.post("/schedule", scheduleMeeting);

/**
 * @route   GET /api/meetings/upcoming
 * @desc    Get upcoming scheduled meetings
 * @access  Private (Role-based filtering)
 */
router.get("/upcoming", getUpcomingMeetings);

/**
 * @route   GET /api/meetings/scheduled
 * @desc    Get all scheduled meetings (alias for upcoming)
 * @access  Private (Role-based filtering)
 */
router.get("/scheduled", getUpcomingMeetings);

/**
 * @route   POST /api/meetings/start-scheduled/:scheduleId
 * @desc    Start a scheduled meeting
 * @access  Private (Creator or Admin only)
 */
router.post("/start-scheduled/:scheduleId", startScheduledMeeting);

/**
 * @route   GET /api/meetings/analytics/overview
 * @desc    Get basic analytics overview for dashboard
 * @access  Private (Super_Admin or HR Manager only)
 */
router.get("/analytics/overview", getAnalyticsOverview);

// Additional utility routes

/**
 * @route   GET /api/meetings/validate/token/:token
 * @desc    Validate an invite token
 * @access  Private
 */
router.get("/validate/token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const MeetingRoom = require("../models/meetingRoomModel");

    const meetingRoom = await MeetingRoom.findOne({
      "invitedUsers.inviteToken": token,
      "invitedUsers.used": false,
      "invitedUsers.expiresAt": { $gt: new Date() },
      meetingStatus: "active",
    });

    if (!meetingRoom) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired invite token",
      });
    }

    const invite = meetingRoom.invitedUsers.find(
      (inv) => inv.inviteToken === token
    );

    res.status(200).json({
      success: true,
      message: "Valid invite token",
      data: {
        roomId: meetingRoom.roomId,
        roomName: meetingRoom.roomName,
        roomType: meetingRoom.roomType,
        teamName: meetingRoom.teamName,
        invitedBy: meetingRoom.createdByName,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate token",
      error: error.message,
    });
  }
});

module.exports = router;
