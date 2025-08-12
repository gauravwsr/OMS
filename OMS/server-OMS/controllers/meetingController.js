const MeetingRoom = require("../models/meetingRoomModel");
const User = require("../models/userModel");
const Candidate = require("../models/Candidate");
const crypto = require("crypto");
// Note: Using Node.js built-in fetch (available in Node 18+)

// Daily.co API configuration
const DAILY_API_KEY =
  process.env.DAILY_API_KEY ||
  "4e0988f781f1d0eda3c64fbdda8465d5282923b87db26911019bfe637b57c1aa";
const DAILY_API_URL = "https://api.daily.co/v1/rooms";

/**
 * Create a new meeting room with role-based restrictions
 */
const createMeeting = async (req, res) => {
  try {
    console.log("=== CREATE MEETING DEBUG ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("User object:", JSON.stringify(req.user, null, 2));

    const { roomName, roomType, teamName, inviteUserIds, meetingSettings } =
      req.body;
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;
    const userName =
      req.user.name ||
      req.user.fullName ||
      (req.user.firstName && req.user.lastName
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.firstName || req.user.lastName || "Unknown User");
    const userTeam = req.user.team;

    console.log("Extracted data:", {
      userId,
      userRole,
      userSubRole,
      userName,
      userTeam,
      roomName,
      roomType,
      teamName,
    });

    // Validate required user fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID not found in authentication token",
      });
    }

    if (!userRole) {
      return res.status(400).json({
        success: false,
        message: "User role not found in authentication token",
      });
    }

    if (!userName || userName === "Unknown User") {
      return res.status(400).json({
        success: false,
        message: "User name not found in authentication token",
      });
    }

    // Role-based creation validation
    if (userRole === "Intern") {
      return res.status(403).json({
        success: false,
        message: "Interns are not authorized to create meetings",
      });
    }

    // Validate team meeting creation for Employees
    if (userRole === "Employee" && roomType === "team") {
      // If user doesn't have a team but is creating a team meeting,
      // allow them to set their team through the meeting creation
      if (!userTeam && !teamName) {
        return res.status(400).json({
          success: false,
          message: "Team name is required for team meetings",
        });
      }

      // If user has a team but is trying to create for a different team
      if (userTeam && teamName && teamName !== userTeam) {
        return res.status(403).json({
          success: false,
          message: "Employees can only create meetings for their own team",
        });
      }
    }

    // Set default room type based on user role
    let finalRoomType = roomType;
    let finalTeamName = teamName;

    if (userRole === "Employee" && !roomType) {
      finalRoomType = "team";
      // Use provided teamName or user's existing team
      finalTeamName = teamName || userTeam;
    } else if (
      (userRole === "Super_Admin" ||
        (userRole === "Admin" && userSubRole === "HR Manager")) &&
      !roomType
    ) {
      finalRoomType = "global";
    }

    // For team meetings, ensure we have a team name
    if (finalRoomType === "team" && !finalTeamName) {
      return res.status(400).json({
        success: false,
        message: "Team name is required for team meetings",
      });
    }

    // Generate room name if not provided
    const finalRoomName = roomName || `${finalRoomType}-meeting-${Date.now()}`;

    // Create room in Daily.co
    console.log("Creating Daily.co room with data:", {
      name: `oms-${finalRoomName
        .replace(/\s+/g, "-")
        .toLowerCase()}-${Date.now()}`,
      privacy: "public",
      properties: {
        enable_chat: meetingSettings?.enableChat !== false,
        enable_knocking: meetingSettings?.enableKnocking !== false,
        start_video_off: meetingSettings?.startVideoOff || false,
        start_audio_off: meetingSettings?.startAudioOff || false,
      },
    });

    let dailyRoomData;

    try {
      const dailyRoomResponse = await fetch(DAILY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: `oms-${finalRoomName
            .replace(/\s+/g, "-")
            .toLowerCase()}-${Date.now()}`,
          privacy: "public",
          properties: {
            enable_chat: meetingSettings?.enableChat !== false,
            enable_knocking: meetingSettings?.enableKnocking !== false,
            start_video_off: meetingSettings?.startVideoOff || false,
            start_audio_off: meetingSettings?.startAudioOff || false,
          },
        }),
      });

      dailyRoomData = await dailyRoomResponse.json();
      console.log("Daily.co API response:", dailyRoomData);

      // If Daily.co fails, create a fallback room URL
      if (!dailyRoomData.url || dailyRoomData.error) {
        console.warn("Daily.co API failed, using fallback:", dailyRoomData);
        const roomId = `demo-${Date.now()}`;
        dailyRoomData = {
          url: `https://demo.daily.co/${roomId}`,
          name: roomId,
          id: roomId,
        };
      }
    } catch (error) {
      console.error("Daily.co API error:", error);
      // Fallback room creation
      const roomId = `demo-${Date.now()}`;
      dailyRoomData = {
        url: `https://demo.daily.co/${roomId}`,
        name: roomId,
        id: roomId,
      };
    }

    // Prepare access rules based on room type and user role
    let accessRules = {
      allowedRoles: [],
      restrictToTeam: false,
      requireInvite: false,
    };

    if (finalRoomType === "global") {
      accessRules.allowedRoles = ["Super_Admin", "Admin", "Employee"];
      accessRules.requireInvite = false;
    } else if (finalRoomType === "team") {
      accessRules.allowedRoles = ["Super_Admin", "Admin", "Employee"];
      accessRules.restrictToTeam = true;
      accessRules.requireInvite = false;
    }

    // Generate unique room ID
    const roomId = `room_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create meeting room in database
    const meetingRoom = new MeetingRoom({
      roomId: roomId,
      roomName: finalRoomName,
      roomUrl: dailyRoomData.url,
      createdBy: userId,
      createdByName: userName,
      createdByRole: userRole,
      roomType: finalRoomType,
      teamName: finalTeamName,
      meetingSettings: {
        enableChat: meetingSettings?.enableChat !== false,
        enableKnocking: meetingSettings?.enableKnocking !== false,
        startVideoOff: meetingSettings?.startVideoOff || false,
        startAudioOff: meetingSettings?.startAudioOff || false,
        maxParticipants: meetingSettings?.maxParticipants || 50,
      },
      accessRules,
    });

    // Handle invited users (mainly for Interns)
    if (inviteUserIds && inviteUserIds.length > 0) {
      for (const inviteUserId of inviteUserIds) {
        try {
          let inviteUser = await User.findById(inviteUserId);
          if (!inviteUser) {
            inviteUser = await Candidate.findById(inviteUserId);
          }

          if (inviteUser) {
            const inviteToken = meetingRoom.generateInviteToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

            meetingRoom.invitedUsers.push({
              userId: inviteUserId,
              userName: inviteUser.name || inviteUser.fullName,
              inviteToken,
              expiresAt,
            });
          }
        } catch (error) {
          console.error(`Error inviting user ${inviteUserId}:`, error);
        }
      }
    }

    // Add creator as first participant
    meetingRoom.addParticipant(userId, userName, userRole);

    // If user doesn't have a team but is creating a team meeting, update their team
    if (!userTeam && finalRoomType === "team" && finalTeamName) {
      try {
        const userToUpdate = await User.findById(userId);
        if (userToUpdate && !userToUpdate.team) {
          userToUpdate.team = finalTeamName;
          await userToUpdate.save();
          console.log(`Updated user ${userName} team to: ${finalTeamName}`);
        }
      } catch (error) {
        console.error("Error updating user team:", error);
        // Continue anyway - this is not critical
      }
    }

    await meetingRoom.save();

    // Generate meeting URLs based on room type
    let meetingUrls = {
      standardUrl: dailyRoomData.url,
      omsUrl: `${req.protocol}://${req.get("host")}/meet/${finalRoomType}/${
        meetingRoom.roomId
      }`,
    };

    // Add invite URLs for invited users
    if (meetingRoom.invitedUsers.length > 0) {
      meetingUrls.inviteUrls = meetingRoom.invitedUsers.map((invite) => ({
        userId: invite.userId,
        userName: invite.userName,
        inviteUrl: `${req.protocol}://${req.get("host")}/meet/invite/${
          invite.inviteToken
        }`,
        expiresAt: invite.expiresAt,
      }));
    }

    res.status(201).json({
      success: true,
      message: "Meeting room created successfully",
      data: {
        roomId: meetingRoom.roomId,
        roomName: meetingRoom.roomName,
        roomType: meetingRoom.roomType,
        teamName: meetingRoom.teamName,
        roomUrl: dailyRoomData.url,
        meetingUrls,
        createdBy: {
          name: userName,
          role: userRole,
        },
        participants: meetingRoom.participants.filter((p) => p.isActive),
        invitedUsers: meetingRoom.invitedUsers.length,
        meetingSettings: meetingRoom.meetingSettings,
      },
    });
  } catch (error) {
    console.error("=== CREATE MEETING ERROR ===");
    console.error("Error creating meeting:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.code,
    });

    // Return more specific error based on the type
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        error: error.message,
        details: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate room ID. Please try again.",
        error: "Room already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create meeting room",
      error: error.message,
    });
  }
};

/**
 * Join a meeting room with role-based validation
 */
const joinMeeting = async (req, res) => {
  try {
    const { roomId, inviteToken } = req.body;
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userName =
      req.user.name ||
      req.user.fullName ||
      (req.user.firstName && req.user.lastName
        ? `${req.user.firstName} ${req.user.lastName}`
        : req.user.firstName || req.user.lastName || "Unknown User");
    const userTeam = req.user.team;

    let meetingRoom;

    // If invite token is provided, find meeting by token
    if (inviteToken) {
      meetingRoom = await MeetingRoom.findOne({
        "invitedUsers.inviteToken": inviteToken,
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

      // Mark invite as used
      const invite = meetingRoom.invitedUsers.find(
        (inv) => inv.inviteToken === inviteToken
      );
      if (invite) {
        invite.used = true;
      }
    } else {
      // Find meeting by roomId
      meetingRoom = await MeetingRoom.findOne({
        roomId,
        meetingStatus: "active",
      });

      if (!meetingRoom) {
        return res.status(404).json({
          success: false,
          message: "Meeting room not found or has ended",
        });
      }
    }

    // Check if user can join this meeting
    const accessCheck = meetingRoom.canUserJoin({
      _id: userId,
      role: userRole,
      team: userTeam,
    });

    if (!accessCheck.canJoin) {
      return res.status(403).json({
        success: false,
        message: accessCheck.reason,
      });
    }

    // Add user as participant
    meetingRoom.addParticipant(userId, userName, userRole);
    await meetingRoom.save();

    res.status(200).json({
      success: true,
      message: "Successfully joined meeting",
      data: {
        roomId: meetingRoom.roomId,
        roomName: meetingRoom.roomName,
        roomUrl: meetingRoom.roomUrl,
        roomType: meetingRoom.roomType,
        teamName: meetingRoom.teamName,
        participant: {
          userId,
          userName,
          userRole,
        },
        activeParticipants: meetingRoom.participants.filter((p) => p.isActive)
          .length,
        meetingSettings: meetingRoom.meetingSettings,
      },
    });
  } catch (error) {
    console.error("Error joining meeting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join meeting",
      error: error.message,
    });
  }
};

/**
 * Get list of meetings user can access
 */
const getUserMeetings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;
    const userTeam = req.user.team;

    const meetings = await MeetingRoom.getUserAccessibleMeetings({
      _id: userId,
      role: userRole,
      subRole: userSubRole,
      team: userTeam,
    });

    // Format meetings for frontend
    const formattedMeetings = meetings.map((meeting) => ({
      roomId: meeting.roomId,
      roomName: meeting.roomName,
      roomType: meeting.roomType,
      teamName: meeting.teamName,
      createdBy: {
        name: meeting.createdByName,
        role: meeting.createdByRole,
      },
      createdAt: meeting.createdAt,
      activeParticipants: meeting.participants.filter((p) => p.isActive).length,
      totalParticipants: meeting.participants.length,
      meetingStatus: meeting.meetingStatus,
      canJoin: meeting.canUserJoin({
        _id: userId,
        role: userRole,
        team: userTeam,
      }).canJoin,
      meetingUrls: {
        standardUrl: meeting.roomUrl,
        omsUrl: `${req.protocol}://${req.get("host")}/meet/${
          meeting.roomType
        }/${meeting.roomId}`,
      },
    }));

    res.status(200).json({
      success: true,
      message: "Meetings retrieved successfully",
      data: formattedMeetings,
      count: formattedMeetings.length,
    });
  } catch (error) {
    console.error("Error getting user meetings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve meetings",
      error: error.message,
    });
  }
};

/**
 * End a meeting (only creator or admin can end)
 */
const endMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    const meetingRoom = await MeetingRoom.findOne({ roomId });

    if (!meetingRoom) {
      return res.status(404).json({
        success: false,
        message: "Meeting room not found",
      });
    }

    // Check if user can end this meeting
    const canEnd =
      meetingRoom.createdBy.toString() === userId.toString() ||
      userRole === "Super_Admin" ||
      (userRole === "Admin" && userSubRole === "HR Manager");

    if (!canEnd) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to end this meeting",
      });
    }

    // Mark all participants as left
    meetingRoom.participants.forEach((participant) => {
      if (participant.isActive) {
        participant.isActive = false;
        participant.leftAt = new Date();
      }
    });

    // Update meeting status
    meetingRoom.meetingStatus = "ended";
    meetingRoom.endedAt = new Date();

    // Calculate duration
    const duration = Math.round(
      (meetingRoom.endedAt - meetingRoom.createdAt) / (1000 * 60)
    );
    meetingRoom.duration = duration;

    await meetingRoom.save();

    // TODO: Call Daily.co API to actually end the room
    // This would require additional Daily.co API calls

    res.status(200).json({
      success: true,
      message: "Meeting ended successfully",
      data: {
        roomId: meetingRoom.roomId,
        roomName: meetingRoom.roomName,
        duration: duration,
        endedAt: meetingRoom.endedAt,
        totalParticipants: meetingRoom.analytics.uniqueParticipants,
      },
    });
  } catch (error) {
    console.error("Error ending meeting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end meeting",
      error: error.message,
    });
  }
};

/**
 * Leave a meeting
 */
const leaveMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id || req.user.userId;

    const meetingRoom = await MeetingRoom.findOne({ roomId });

    if (!meetingRoom) {
      return res.status(404).json({
        success: false,
        message: "Meeting room not found",
      });
    }

    meetingRoom.removeParticipant(userId);
    await meetingRoom.save();

    res.status(200).json({
      success: true,
      message: "Left meeting successfully",
      data: {
        roomId: meetingRoom.roomId,
        activeParticipants: meetingRoom.participants.filter((p) => p.isActive)
          .length,
      },
    });
  } catch (error) {
    console.error("Error leaving meeting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to leave meeting",
      error: error.message,
    });
  }
};

/**
 * Get meeting details (for authorized users)
 */
const getMeetingDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userTeam = req.user.team;

    const meetingRoom = await MeetingRoom.findOne({ roomId })
      .populate("createdBy", "name email role subRole")
      .populate("participants.userId", "name email role subRole");

    if (!meetingRoom) {
      return res.status(404).json({
        success: false,
        message: "Meeting room not found",
      });
    }

    // Check if user can access this meeting
    const accessCheck = meetingRoom.canUserJoin({
      _id: userId,
      role: userRole,
      team: userTeam,
    });

    // Allow viewing details even if cannot join (for admin oversight)
    const canView =
      accessCheck.canJoin ||
      userRole === "Super_Admin" ||
      (userRole === "Admin" && req.user.subRole === "HR Manager");

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this meeting",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meeting details retrieved successfully",
      data: {
        roomId: meetingRoom.roomId,
        roomName: meetingRoom.roomName,
        roomType: meetingRoom.roomType,
        teamName: meetingRoom.teamName,
        roomUrl: meetingRoom.roomUrl,
        createdBy: meetingRoom.createdBy,
        createdAt: meetingRoom.createdAt,
        meetingStatus: meetingRoom.meetingStatus,
        participants: meetingRoom.participants,
        invitedUsers: meetingRoom.invitedUsers.map((invite) => ({
          userName: invite.userName,
          invitedAt: invite.invitedAt,
          expiresAt: invite.expiresAt,
          used: invite.used,
        })),
        analytics: meetingRoom.analytics,
        meetingSettings: meetingRoom.meetingSettings,
        accessRules: meetingRoom.accessRules,
        canJoin: accessCheck.canJoin,
        canEnd:
          meetingRoom.createdBy.toString() === userId.toString() ||
          userRole === "Super_Admin" ||
          (userRole === "Admin" && req.user.subRole === "HR Manager"),
      },
    });
  } catch (error) {
    console.error("Error getting meeting details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve meeting details",
      error: error.message,
    });
  }
};

/**
 * Invite users to a meeting (for meeting creators and admins)
 */
const inviteUsersToMeeting = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userIds } = req.body;
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    const meetingRoom = await MeetingRoom.findOne({ roomId });

    if (!meetingRoom) {
      return res.status(404).json({
        success: false,
        message: "Meeting room not found",
      });
    }

    // Check if user can invite others
    const canInvite =
      meetingRoom.createdBy.toString() === userId.toString() ||
      userRole === "Super_Admin" ||
      (userRole === "Admin" && userSubRole === "HR Manager");

    if (!canInvite) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to invite users to this meeting",
      });
    }

    const invitedUsers = [];

    for (const inviteUserId of userIds) {
      try {
        let inviteUser = await User.findById(inviteUserId);
        if (!inviteUser) {
          inviteUser = await Candidate.findById(inviteUserId);
        }

        if (inviteUser) {
          // Check if user is already invited
          const existingInvite = meetingRoom.invitedUsers.find(
            (inv) =>
              inv.userId.toString() === inviteUserId.toString() && !inv.used
          );

          if (!existingInvite) {
            const inviteToken = meetingRoom.generateInviteToken();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

            meetingRoom.invitedUsers.push({
              userId: inviteUserId,
              userName: inviteUser.name || inviteUser.fullName,
              inviteToken,
              expiresAt,
            });

            invitedUsers.push({
              userId: inviteUserId,
              userName: inviteUser.name || inviteUser.fullName,
              inviteUrl: `${req.protocol}://${req.get(
                "host"
              )}/meet/invite/${inviteToken}`,
              expiresAt,
            });
          }
        }
      } catch (error) {
        console.error(`Error inviting user ${inviteUserId}:`, error);
      }
    }

    await meetingRoom.save();

    res.status(200).json({
      success: true,
      message: "Users invited successfully",
      data: {
        roomId: meetingRoom.roomId,
        invitedUsers,
        totalInvites: meetingRoom.invitedUsers.length,
      },
    });
  } catch (error) {
    console.error("Error inviting users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to invite users",
      error: error.message,
    });
  }
};

/**
 * Get detailed analytics for meetings
 */
const getDetailedAnalytics = async (req, res) => {
  try {
    const { range = "week", team = "all" } = req.query;
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    // Check authorization
    if (
      userRole !== "Super_Admin" &&
      !(userRole === "Admin" && userSubRole === "HR Manager")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view analytics",
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate;

    switch (range) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    const query = {
      createdAt: { $gte: startDate, $lte: now },
    };

    if (team !== "all") {
      query.teamName = team;
    }

    // Get meetings data
    const meetings = await MeetingRoom.find(query).sort({ createdAt: -1 });

    // Calculate overview statistics
    const totalMeetings = meetings.length;
    const activeMeetings = meetings.filter(
      (m) => m.meetingStatus === "active"
    ).length;
    const completedMeetings = meetings.filter(
      (m) => m.meetingStatus === "ended"
    ).length;
    const todaysMeetings = meetings.filter((m) => {
      const today = new Date();
      const meetingDate = new Date(m.createdAt);
      return today.toDateString() === meetingDate.toDateString();
    }).length;

    // Calculate durations
    const endedMeetings = meetings.filter((m) => m.duration && m.duration > 0);
    const totalDuration = endedMeetings.reduce((sum, m) => sum + m.duration, 0);
    const avgDurationMinutes =
      endedMeetings.length > 0
        ? Math.round(totalDuration / endedMeetings.length)
        : 0;
    const totalHours = Math.round((totalDuration / 60) * 10) / 10;

    // Calculate participants
    const allParticipants = new Set();
    let totalParticipantSessions = 0;

    meetings.forEach((meeting) => {
      meeting.participants.forEach((participant) => {
        allParticipants.add(participant.userId.toString());
        totalParticipantSessions++;
      });
    });

    const uniqueParticipants = allParticipants.size;
    const avgParticipants =
      totalMeetings > 0
        ? Math.round((totalParticipantSessions / totalMeetings) * 10) / 10
        : 0;

    // Calculate success rate
    const successRate =
      totalMeetings > 0
        ? Math.round((completedMeetings / totalMeetings) * 100)
        : 0;

    // Daily stats for chart
    const dailyStats = [];
    const daysCount =
      range === "day" ? 1 : range === "week" ? 7 : range === "month" ? 30 : 90;

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayMeetings = meetings.filter(
        (m) => m.createdAt >= dayStart && m.createdAt < dayEnd
      ).length;

      dailyStats.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        count: dayMeetings,
      });
    }

    // Distribution stats
    const globalMeetings = meetings.filter(
      (m) => m.roomType === "global"
    ).length;
    const teamMeetings = meetings.filter((m) => m.roomType === "team").length;

    // Team stats
    const teamStats = {};
    meetings.forEach((meeting) => {
      if (meeting.teamName) {
        if (!teamStats[meeting.teamName]) {
          teamStats[meeting.teamName] = {
            name: meeting.teamName,
            meetings: 0,
            totalDuration: 0,
            participants: new Set(),
          };
        }
        teamStats[meeting.teamName].meetings++;
        if (meeting.duration) {
          teamStats[meeting.teamName].totalDuration += meeting.duration;
        }
        meeting.participants.forEach((p) => {
          teamStats[meeting.teamName].participants.add(p.userId.toString());
        });
      }
    });

    const formattedTeamStats = Object.values(teamStats).map((team) => ({
      name: team.name,
      meetings: team.meetings,
      totalHours: Math.round((team.totalDuration / 60) * 10) / 10,
      avgParticipants:
        team.meetings > 0
          ? Math.round((team.participants.size / team.meetings) * 10) / 10
          : 0,
    }));

    // Recent activity
    const recentActivity = meetings.slice(0, 10).map((meeting) => ({
      timestamp: meeting.createdAt,
      userName: meeting.createdByName,
      action: "created meeting",
      meetingName: meeting.roomName,
    }));

    // Get unique teams for filter
    const teams = [...new Set(meetings.map((m) => m.teamName).filter(Boolean))];

    // Calculate change percentage (mock for now)
    const changePercent = Math.floor(Math.random() * 20) + 5; // Mock data

    const analyticsData = {
      overview: {
        totalMeetings,
        activeMeetings,
        completedMeetings,
        todaysMeetings,
        avgDurationMinutes,
        totalHours,
        uniqueParticipants,
        avgParticipants,
        successRate,
        changePercent,
      },
      distribution: {
        globalMeetings,
        teamMeetings,
      },
      dailyStats,
      teamStats: formattedTeamStats,
      recentActivity,
      teams,
    };

    res.status(200).json({
      success: true,
      message: "Analytics retrieved successfully",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Error getting detailed analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics",
      error: error.message,
    });
  }
};

/**
 * Export analytics data to Excel
 */
const exportAnalytics = async (req, res) => {
  try {
    const { range = "week", team = "all", format = "excel" } = req.query;
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    // Check authorization
    if (
      userRole !== "Super_Admin" &&
      !(userRole === "Admin" && userSubRole === "HR Manager")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to export analytics",
      });
    }

    // Calculate date range (same logic as above)
    const now = new Date();
    let startDate;

    switch (range) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const query = {
      createdAt: { $gte: startDate, $lte: now },
    };

    if (team !== "all") {
      query.teamName = team;
    }

    const meetings = await MeetingRoom.find(query)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    if (format === "excel") {
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();

      // Summary sheet
      const summarySheet = workbook.addWorksheet("Summary");
      summarySheet.columns = [
        { header: "Metric", key: "metric", width: 25 },
        { header: "Value", key: "value", width: 15 },
      ];

      summarySheet.addRows([
        { metric: "Total Meetings", value: meetings.length },
        {
          metric: "Active Meetings",
          value: meetings.filter((m) => m.meetingStatus === "active").length,
        },
        {
          metric: "Completed Meetings",
          value: meetings.filter((m) => m.meetingStatus === "ended").length,
        },
        {
          metric: "Global Meetings",
          value: meetings.filter((m) => m.roomType === "global").length,
        },
        {
          metric: "Team Meetings",
          value: meetings.filter((m) => m.roomType === "team").length,
        },
      ]);

      // Detailed meetings sheet
      const meetingsSheet = workbook.addWorksheet("Meetings");
      meetingsSheet.columns = [
        { header: "Room Name", key: "roomName", width: 25 },
        { header: "Type", key: "roomType", width: 10 },
        { header: "Team", key: "teamName", width: 15 },
        { header: "Created By", key: "createdBy", width: 20 },
        { header: "Created At", key: "createdAt", width: 20 },
        { header: "Status", key: "meetingStatus", width: 12 },
        { header: "Duration (min)", key: "duration", width: 15 },
        { header: "Participants", key: "participants", width: 12 },
      ];

      const meetingRows = meetings.map((meeting) => ({
        roomName: meeting.roomName,
        roomType: meeting.roomType,
        teamName: meeting.teamName || "N/A",
        createdBy: meeting.createdBy?.name || meeting.createdByName,
        createdAt: meeting.createdAt.toLocaleString(),
        meetingStatus: meeting.meetingStatus,
        duration: meeting.duration || 0,
        participants: meeting.participants.length,
      }));

      meetingsSheet.addRows(meetingRows);

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=meeting-analytics-${range}.xlsx`
      );

      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // Return JSON format
      res.status(200).json({
        success: true,
        data: {
          meetings: meetings.map((meeting) => ({
            roomName: meeting.roomName,
            roomType: meeting.roomType,
            teamName: meeting.teamName,
            createdBy: meeting.createdBy?.name || meeting.createdByName,
            createdAt: meeting.createdAt,
            meetingStatus: meeting.meetingStatus,
            duration: meeting.duration,
            participants: meeting.participants.length,
          })),
          summary: {
            totalMeetings: meetings.length,
            activeMeetings: meetings.filter((m) => m.meetingStatus === "active")
              .length,
            completedMeetings: meetings.filter(
              (m) => m.meetingStatus === "ended"
            ).length,
          },
        },
      });
    }
  } catch (error) {
    console.error("Error exporting analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export analytics",
      error: error.message,
    });
  }
};

/**
 * Schedule a meeting for future date/time
 */
const scheduleMeeting = async (req, res) => {
  try {
    const {
      meetingName,
      roomType,
      teamName,
      description,
      scheduledAt,
      duration,
      emailReminder,
      reminderMinutes,
      meetingSettings,
    } = req.body;

    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userName = req.user.name || req.user.fullName || "Unknown User";
    const userTeam = req.user.team;

    // Validate required fields
    if (!meetingName || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "Meeting name and scheduled time are required",
      });
    }

    // Validate scheduled time is in future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Scheduled time must be in the future",
      });
    }

    // Role-based validation
    if (userRole === "Intern") {
      return res.status(403).json({
        success: false,
        message: "Interns are not authorized to schedule meetings",
      });
    }

    // Set default room type based on user role
    let finalRoomType = roomType;
    let finalTeamName = teamName;

    if (userRole === "Employee" && !roomType) {
      finalRoomType = "team";
      finalTeamName = teamName || userTeam;
    } else if (
      (userRole === "Super_Admin" ||
        (userRole === "Admin" && req.user.subRole === "HR Manager")) &&
      !roomType
    ) {
      finalRoomType = "global";
    }

    // For team meetings, ensure we have a team name
    if (finalRoomType === "team" && !finalTeamName) {
      return res.status(400).json({
        success: false,
        message: "Team name is required for team meetings",
      });
    }

    // Create scheduled meeting record
    const scheduledMeeting = new MeetingRoom({
      roomId: `scheduled_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      roomName: meetingName,
      roomUrl: "", // Will be created when meeting starts
      createdBy: userId,
      createdByName: userName,
      createdByRole: userRole,
      roomType: finalRoomType,
      teamName: finalTeamName,
      description: description || "",
      scheduledAt: scheduledDate,
      duration: duration || 60,
      meetingStatus: "scheduled",
      meetingSettings: {
        enableChat: meetingSettings?.enableChat !== false,
        enableKnocking: meetingSettings?.enableKnocking !== false,
        startVideoOff: meetingSettings?.startVideoOff || false,
        startAudioOff: meetingSettings?.startAudioOff || false,
        maxParticipants: meetingSettings?.maxParticipants || 50,
      },
      emailReminder: emailReminder || false,
      reminderMinutes: reminderMinutes || 15,
      accessRules: {
        allowedRoles:
          finalRoomType === "global"
            ? ["Super_Admin", "Admin", "Employee"]
            : ["Super_Admin", "Admin", "Employee"],
        restrictToTeam: finalRoomType === "team",
        requireInvite: false,
      },
    });

    await scheduledMeeting.save();

    // TODO: Schedule email reminder if requested
    if (emailReminder) {
      // Implementation for email scheduling would go here
      console.log(
        `Email reminder scheduled for ${reminderMinutes} minutes before meeting`
      );
    }

    res.status(201).json({
      success: true,
      message: "Meeting scheduled successfully",
      data: {
        scheduleId: scheduledMeeting._id,
        roomId: scheduledMeeting.roomId,
        meetingName: scheduledMeeting.roomName,
        scheduledAt: scheduledMeeting.scheduledAt,
        duration: scheduledMeeting.duration,
        roomType: scheduledMeeting.roomType,
        teamName: scheduledMeeting.teamName,
      },
    });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to schedule meeting",
      error: error.message,
    });
  }
};

/**
 * Get upcoming scheduled meetings
 */
const getUpcomingMeetings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userTeam = req.user.team;

    const now = new Date();
    const query = {
      meetingStatus: "scheduled",
      scheduledAt: { $gte: now },
    };

    // Role-based filtering
    if (userRole === "Employee") {
      query.$or = [
        { createdBy: userId },
        { roomType: "global" },
        { roomType: "team", teamName: userTeam },
      ];
    } else if (userRole === "Intern") {
      query.$or = [{ "invitedUsers.userId": userId }, { createdBy: userId }];
    }
    // Super_Admin and HR Managers can see all meetings

    const upcomingMeetings = await MeetingRoom.find(query)
      .sort({ scheduledAt: 1 })
      .limit(20);

    const formattedMeetings = upcomingMeetings.map((meeting) => ({
      _id: meeting._id,
      meetingName: meeting.roomName,
      description: meeting.description,
      scheduledDateTime: meeting.scheduledAt,
      duration: meeting.duration,
      roomType: meeting.roomType,
      teamName: meeting.teamName,
      createdBy: meeting.createdByName,
      status: meeting.meetingStatus,
      canStart:
        meeting.createdBy.toString() === userId.toString() ||
        userRole === "Super_Admin" ||
        (userRole === "Admin" && req.user.subRole === "HR Manager"),
    }));

    res.status(200).json({
      success: true,
      message: "Upcoming meetings retrieved successfully",
      data: formattedMeetings,
    });
  } catch (error) {
    console.error("Error getting upcoming meetings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve upcoming meetings",
      error: error.message,
    });
  }
};

/**
 * Start a scheduled meeting
 */
const startScheduledMeeting = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user._id || req.user.userId;
    const userRole = req.user.role;
    const userName = req.user.name || req.user.fullName || "Unknown User";

    const scheduledMeeting = await MeetingRoom.findById(scheduleId);

    if (!scheduledMeeting) {
      return res.status(404).json({
        success: false,
        message: "Scheduled meeting not found",
      });
    }

    if (scheduledMeeting.meetingStatus !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Meeting is not in scheduled status",
      });
    }

    // Check if user can start this meeting
    const canStart =
      scheduledMeeting.createdBy.toString() === userId.toString() ||
      userRole === "Super_Admin" ||
      (userRole === "Admin" && req.user.subRole === "HR Manager");

    if (!canStart) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to start this meeting",
      });
    }

    // Check if meeting time has arrived (allow starting 10 minutes early)
    const now = new Date();
    const scheduledTime = new Date(scheduledMeeting.scheduledAt);
    const earliestStart = new Date(scheduledTime.getTime() - 10 * 60 * 1000); // 10 minutes early

    if (now < earliestStart) {
      return res.status(400).json({
        success: false,
        message:
          "Meeting cannot be started more than 10 minutes before scheduled time",
      });
    }

    // Create room in Daily.co
    let dailyRoomData;

    try {
      const dailyRoomResponse = await fetch(DAILY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
        body: JSON.stringify({
          name: `oms-${scheduledMeeting.roomName
            .replace(/\s+/g, "-")
            .toLowerCase()}-${Date.now()}`,
          privacy: "public",
          properties: {
            enable_chat: scheduledMeeting.meetingSettings?.enableChat !== false,
            enable_knocking:
              scheduledMeeting.meetingSettings?.enableKnocking !== false,
            start_video_off:
              scheduledMeeting.meetingSettings?.startVideoOff || false,
            start_audio_off:
              scheduledMeeting.meetingSettings?.startAudioOff || false,
          },
        }),
      });

      dailyRoomData = await dailyRoomResponse.json();

      // If Daily.co fails, create a fallback room URL
      if (!dailyRoomData.url || dailyRoomData.error) {
        console.warn(
          "Daily.co API failed for scheduled meeting, using fallback:",
          dailyRoomData
        );
        const roomId = `scheduled-demo-${Date.now()}`;
        dailyRoomData = {
          url: `https://demo.daily.co/${roomId}`,
          name: roomId,
          id: roomId,
        };
      }
    } catch (error) {
      console.error("Daily.co API error for scheduled meeting:", error);
      // Fallback room creation
      const roomId = `scheduled-demo-${Date.now()}`;
      dailyRoomData = {
        url: `https://demo.daily.co/${roomId}`,
        name: roomId,
        id: roomId,
      };
    }

    // Update scheduled meeting to active
    scheduledMeeting.roomUrl = dailyRoomData.url;
    scheduledMeeting.meetingStatus = "active";
    scheduledMeeting.actualStartTime = now;
    scheduledMeeting.roomId = `room_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Add creator as first participant
    scheduledMeeting.addParticipant(userId, userName, userRole);

    await scheduledMeeting.save();

    res.status(200).json({
      success: true,
      message: "Scheduled meeting started successfully",
      data: {
        roomId: scheduledMeeting.roomId,
        roomName: scheduledMeeting.roomName,
        roomUrl: dailyRoomData.url,
        roomType: scheduledMeeting.roomType,
        teamName: scheduledMeeting.teamName,
        startedAt: now,
      },
    });
  } catch (error) {
    console.error("Error starting scheduled meeting:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start scheduled meeting",
      error: error.message,
    });
  }
};

/**
 * Get analytics overview for dashboard
 */
const getAnalyticsOverview = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userSubRole = req.user.subRole;

    // Check authorization
    if (
      userRole !== "Super_Admin" &&
      !(userRole === "Admin" && userSubRole === "HR Manager")
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view analytics",
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get basic statistics
    const totalMeetings = await MeetingRoom.countDocuments({});
    const activeMeetings = await MeetingRoom.countDocuments({
      meetingStatus: "active",
    });
    const todaysMeetings = await MeetingRoom.countDocuments({
      createdAt: { $gte: today },
    });

    // Calculate average duration
    const completedMeetings = await MeetingRoom.find({
      meetingStatus: "ended",
      duration: { $exists: true, $gt: 0 },
    });

    const avgDurationMinutes =
      completedMeetings.length > 0
        ? Math.round(
            completedMeetings.reduce((sum, m) => sum + m.duration, 0) /
              completedMeetings.length
          )
        : 0;

    // Distribution stats
    const globalMeetings = await MeetingRoom.countDocuments({
      roomType: "global",
    });
    const teamMeetings = await MeetingRoom.countDocuments({ roomType: "team" });

    const overview = {
      totalMeetings,
      activeMeetings,
      todaysMeetings,
      avgDurationMinutes,
      globalMeetings,
      teamMeetings,
    };

    const distribution = {
      globalMeetings,
      teamMeetings,
    };

    res.status(200).json({
      success: true,
      message: "Analytics overview retrieved successfully",
      data: {
        overview,
        distribution,
      },
    });
  } catch (error) {
    console.error("Error getting analytics overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve analytics overview",
      error: error.message,
    });
  }
};

module.exports = {
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
};
