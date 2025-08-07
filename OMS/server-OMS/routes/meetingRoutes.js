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

/**
 * @route   GET /api/meetings/analytics/overview
 * @desc    Get meeting analytics overview (Admin only)
 * @access  Private (Admin only)
 */
router.get("/analytics/overview", async (req, res) => {
  try {
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    // Only allow admins to access analytics
    if (
      userRole !== "Super_Admin" &&
      !(userRole === "Admin" && userSubRole === "HR Manager")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const MeetingRoom = require("../models/meetingRoomModel");

    // Get analytics data
    const totalMeetings = await MeetingRoom.countDocuments();
    const activeMeetings = await MeetingRoom.countDocuments({
      meetingStatus: "active",
    });
    const endedMeetings = await MeetingRoom.countDocuments({
      meetingStatus: "ended",
    });

    // Get meetings by room type
    const globalMeetings = await MeetingRoom.countDocuments({
      roomType: "global",
    });
    const teamMeetings = await MeetingRoom.countDocuments({ roomType: "team" });

    // Get today's meetings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysMeetings = await MeetingRoom.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // Get average meeting duration
    const completedMeetings = await MeetingRoom.find({
      meetingStatus: "ended",
      duration: { $exists: true },
    }).select("duration");

    const avgDuration =
      completedMeetings.length > 0
        ? completedMeetings.reduce(
            (sum, meeting) => sum + meeting.duration,
            0
          ) / completedMeetings.length
        : 0;

    // Get most active teams
    const teamActivity = await MeetingRoom.aggregate([
      { $match: { roomType: "team", teamName: { $exists: true } } },
      { $group: { _id: "$teamName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      message: "Analytics retrieved successfully",
      data: {
        overview: {
          totalMeetings,
          activeMeetings,
          endedMeetings,
          todaysMeetings,
          avgDurationMinutes: Math.round(avgDuration),
        },
        distribution: {
          globalMeetings,
          teamMeetings,
        },
        topTeams: teamActivity.map((team) => ({
          teamName: team._id,
          meetingCount: team.count,
        })),
      },
    });
  } catch (error) {
    console.error("Error getting analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics",
      error: error.message,
    });
  }
});

module.exports = router;
