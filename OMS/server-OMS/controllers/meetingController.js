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
          // Removed max_participants as it's not supported in the current plan
        },
      }),
    });

    const dailyRoomData = await dailyRoomResponse.json();

    if (!dailyRoomData.url) {
      return res.status(500).json({
        success: false,
        message: "Failed to create Daily.co room",
        error: dailyRoomData.error || "Unknown error",
      });
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

module.exports = {
  createMeeting,
  joinMeeting,
  getUserMeetings,
  endMeeting,
  leaveMeeting,
  getMeetingDetails,
  inviteUsersToMeeting,
};
