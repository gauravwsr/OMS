const mongoose = require("mongoose");

// Enhanced Meeting Room Schema for role-based access control
const meetingRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    roomUrl: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    createdByRole: {
      type: String,
      enum: ["Super_Admin", "Admin", "Employee", "Intern"],
      required: true,
    },
    roomType: {
      type: String,
      enum: ["global", "team"],
      required: true,
    },
    teamName: {
      type: String,
      required: function () {
        return this.roomType === "team";
      },
      trim: true,
    },
    // Participants who have joined the meeting
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        userRole: {
          type: String,
          enum: ["Super_Admin", "Admin", "Employee", "Intern"],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        leftAt: {
          type: Date,
          default: null,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Invited users for restricted access (mainly for Interns)
    invitedUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        inviteToken: {
          type: String,
          required: true,
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          required: true,
        },
        used: {
          type: Boolean,
          default: false,
        },
      },
    ],
    meetingSettings: {
      enableChat: {
        type: Boolean,
        default: true,
      },
      enableKnocking: {
        type: Boolean,
        default: true,
      },
      startVideoOff: {
        type: Boolean,
        default: false,
      },
      startAudioOff: {
        type: Boolean,
        default: false,
      },
      maxParticipants: {
        type: Number,
        default: 50,
      },
    },
    meetingStatus: {
      type: String,
      enum: ["active", "ended", "scheduled"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    actualStartTime: {
      type: Date,
      default: null,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // in minutes
      default: null,
    },
    emailReminder: {
      type: Boolean,
      default: false,
    },
    reminderMinutes: {
      type: Number,
      default: 15,
    },
    // Security and access control
    accessRules: {
      allowedRoles: [
        {
          type: String,
          enum: ["Super_Admin", "Admin", "Employee", "Intern"],
        },
      ],
      restrictToTeam: {
        type: Boolean,
        default: false,
      },
      requireInvite: {
        type: Boolean,
        default: false,
      },
    },
    // Meeting analytics
    analytics: {
      totalJoins: {
        type: Number,
        default: 0,
      },
      uniqueParticipants: {
        type: Number,
        default: 0,
      },
      averageDuration: {
        type: Number, // in minutes
        default: 0,
      },
      peakParticipants: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
meetingRoomSchema.index({ roomId: 1 }, { unique: true });
meetingRoomSchema.index({ createdBy: 1, createdAt: -1 });
meetingRoomSchema.index({ roomType: 1, teamName: 1 });
meetingRoomSchema.index({ meetingStatus: 1 });
meetingRoomSchema.index({ scheduledAt: 1 });
meetingRoomSchema.index({ "participants.userId": 1 });
meetingRoomSchema.index({ "invitedUsers.userId": 1 });
meetingRoomSchema.index({ "invitedUsers.inviteToken": 1 });

// Pre-save middleware to generate roomId
meetingRoomSchema.pre("save", function (next) {
  if (!this.roomId) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);

    if (this.roomType === "global") {
      this.roomId = `global-${timestamp}-${randomString}`;
    } else {
      this.roomId = `team-${this.teamName}-${timestamp}-${randomString}`;
    }
  }
  next();
});

// Instance methods
meetingRoomSchema.methods.generateInviteToken = function () {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

meetingRoomSchema.methods.addParticipant = function (
  userId,
  userName,
  userRole
) {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(
    (p) => p.userId.toString() === userId.toString() && p.isActive
  );

  if (!existingParticipant) {
    this.participants.push({
      userId,
      userName,
      userRole,
      joinedAt: new Date(),
      isActive: true,
    });

    this.analytics.totalJoins += 1;
    this.analytics.uniqueParticipants = new Set(
      this.participants.map((p) => p.userId.toString())
    ).size;

    const currentActive = this.participants.filter((p) => p.isActive).length;
    if (currentActive > this.analytics.peakParticipants) {
      this.analytics.peakParticipants = currentActive;
    }
  }
};

meetingRoomSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find(
    (p) => p.userId.toString() === userId.toString() && p.isActive
  );

  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
};

meetingRoomSchema.methods.canUserJoin = function (user) {
  const { role, subRole, team } = user;

  // Super_Admin and Admin can join any meeting
  if (
    role === "Super_Admin" ||
    (role === "Admin" && subRole === "HR Manager")
  ) {
    return { canJoin: true, reason: "Admin access" };
  }

  // Check if meeting is team-restricted
  if (this.roomType === "team") {
    // Employees can only join their team meetings
    if (role === "Employee" && user.team !== this.teamName) {
      return { canJoin: false, reason: "Not authorized for this team meeting" };
    }
  }

  // Check if user needs invite (mainly for Interns)
  if (this.accessRules.requireInvite || role === "Intern") {
    const invite = this.invitedUsers.find(
      (inv) =>
        inv.userId.toString() === user._id.toString() &&
        !inv.used &&
        new Date() < inv.expiresAt
    );

    if (!invite) {
      return { canJoin: false, reason: "Valid invite required" };
    }
  }

  // Check allowed roles
  if (this.accessRules.allowedRoles.length > 0) {
    if (!this.accessRules.allowedRoles.includes(role)) {
      return { canJoin: false, reason: "Role not authorized" };
    }
  }

  return { canJoin: true, reason: "Authorized" };
};

// Static methods
meetingRoomSchema.statics.getUserAccessibleMeetings = function (user) {
  const { role, subRole, team, _id } = user;

  let query = {
    meetingStatus: { $in: ["active", "scheduled"] },
  };

  // Super_Admin and HR Manager can see all meetings
  if (
    role === "Super_Admin" ||
    (role === "Admin" && subRole === "HR Manager")
  ) {
    return this.find(query).populate("createdBy", "name email role subRole");
  }

  // Employees can see global meetings and their team meetings
  if (role === "Employee") {
    query.$or = [
      { roomType: "global" },
      { roomType: "team", teamName: team },
      { createdBy: _id },
    ];
  }

  // Interns can only see meetings they're invited to
  if (role === "Intern") {
    query["invitedUsers.userId"] = _id;
    query["invitedUsers.used"] = false;
    query["invitedUsers.expiresAt"] = { $gt: new Date() };
  }

  return this.find(query).populate("createdBy", "name email role subRole");
};

const MeetingRoom = mongoose.model("MeetingRoom", meetingRoomSchema);

module.exports = MeetingRoom;
