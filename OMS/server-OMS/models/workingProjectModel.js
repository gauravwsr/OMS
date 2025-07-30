const mongoose = require("mongoose");

const teamLeadHistorySchema = new mongoose.Schema(
  {
    teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teamLeadName: String,
    assignedDate: String, // Format: YYYY-MM-DD
    unassignedDate: String, // Format: YYYY-MM-DD
  },
  { _id: false }
);

const assignedEmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    email: String,
    role: String,
    subRole: String,
  },
  { _id: false }
);

// Schema for working data (editable copy)
const workingProjectSchema = new mongoose.Schema(
  {
    // Reference to original CRM data (optional for manually created projects)
    crmProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CrmProject",
      required: false,
      index: true,
    },
    externalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    projectId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    leadName: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    projectStatus: {
      type: String,
      required: true,
      enum: ["Active", "Completed", "Overdue", "Pending", "On Hold"],
      default: "Pending",
    },
    projectPassword: {
      type: String,
      required: true,
    },
    // Team Lead Assignment fields (editable)
    assignedTeamLead: {
      type: String,
      default: null,
      trim: true,
    },
    teamLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDate: {
      type: Date,
      default: null,
    },
    // Additional project details (editable)
    description: {
      type: String,
      trim: true,
    },
    requirements: {
      type: String,
      trim: true,
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expectedEndDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Budget tracking (editable)
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    spent: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Project milestones (editable)
    milestones: [
      {
        name: String,
        status: {
          type: String,
          enum: ["pending", "in-progress", "completed"],
          default: "pending",
        },
        dueDate: Date,
        completedDate: Date,
      },
    ],
    // Risk assessment (editable)
    risks: [
      {
        level: {
          type: String,
          enum: ["low", "medium", "high"],
          default: "medium",
        },
        description: String,
        mitigationPlan: String,
      },
    ],
    // Task tracking (editable)
    tasks: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    // Contact information (editable)
    clientContact: {
      name: String,
      email: String,
      phone: String,
    },
    // Project files and documents (editable)
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Project notes and comments (editable)
    notes: [
      {
        content: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Team management (editable)
    teamLeadHistory: [teamLeadHistorySchema],
    assignedEmployees: [assignedEmployeeSchema],

    // Sync tracking
    lastSyncedWithCrm: {
      type: Date,
      default: Date.now,
    },
    hasLocalModifications: {
      type: Boolean,
      default: false,
    },
    modifiedFields: [
      {
        fieldName: String,
        modifiedAt: {
          type: Date,
          default: Date.now,
        },
        modifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
workingProjectSchema.index({ projectId: 1 });
workingProjectSchema.index({ externalId: 1 });
workingProjectSchema.index({ crmProjectId: 1 });
workingProjectSchema.index({ assignedTeamLead: 1 });
workingProjectSchema.index({ teamLeadId: 1 });
workingProjectSchema.index({ projectStatus: 1 });
workingProjectSchema.index({ leadName: 1 });
workingProjectSchema.index({ clientName: 1 });

// Pre-save middleware to track modifications
workingProjectSchema.pre("save", function (next) {
  if (this.isModified() && !this.isNew) {
    this.hasLocalModifications = true;
  }

  if (
    this.isModified("assignedTeamLead") &&
    this.assignedTeamLead &&
    !this.assignedDate
  ) {
    this.assignedDate = new Date();
  }
  next();
});

// Instance method to assign team lead
workingProjectSchema.methods.assignTeamLead = function (
  teamLeadName,
  teamLeadId,
  assignedById
) {
  this.assignedTeamLead = teamLeadName;
  this.teamLeadId = teamLeadId;
  this.assignedBy = assignedById;
  this.assignedDate = new Date();
  this.hasLocalModifications = true;
  return this.save();
};

// Static method to get projects assigned to a specific team lead
workingProjectSchema.statics.getProjectsForTeamLead = function (
  teamLeadIdentifier
) {
  return this.find({
    $or: [
      { assignedTeamLead: teamLeadIdentifier },
      { teamLeadId: teamLeadIdentifier },
      { leadName: teamLeadIdentifier },
    ],
  })
    .populate("teamLeadId", "name email subRole")
    .populate("assignedBy", "name email")
    .populate("crmProjectId")
    .sort({ createdAt: -1 });
};

// Static method to get all projects with populated info
workingProjectSchema.statics.getAllWithTeamLeads = function () {
  return this.find({})
    .populate("teamLeadId", "name email subRole specialization")
    .populate("assignedBy", "name email")
    .populate("teamLeadHistory.teamLeadId", "name email")
    .populate("crmProjectId")
    .sort({ createdAt: -1 });
};

// Static method to sync with CRM data
workingProjectSchema.statics.syncWithCrmProject = async function (crmProject) {
  let workingProject = await this.findOne({
    externalId: crmProject.externalId,
  });

  if (!workingProject) {
    // Create new working project from CRM data
    workingProject = new this({
      crmProjectId: crmProject._id,
      externalId: crmProject.externalId,
      projectId: crmProject.projectId,
      leadName: crmProject.leadName,
      clientName: crmProject.clientName,
      finalAmount: crmProject.finalAmount,
      projectStatus: crmProject.projectStatus,
      projectPassword: crmProject.projectPassword,
      assignedTeamLead: crmProject.assignedTeamLead,
      teamLeadId: crmProject.teamLeadId,
      description: crmProject.description,
      budget: crmProject.budget,
      progress: crmProject.progress,
      technologies: crmProject.technologies,
      milestones: crmProject.milestones,
      risks: crmProject.risks,
      tasks: crmProject.tasks,
      lastSyncedWithCrm: new Date(),
    });
  } else {
    // Update only non-modified fields or merge selectively
    if (!workingProject.hasLocalModifications) {
      // If no local modifications, update everything
      Object.keys(crmProject.toObject()).forEach((key) => {
        if (
          key !== "_id" &&
          key !== "__v" &&
          key !== "createdAt" &&
          key !== "updatedAt"
        ) {
          workingProject[key] = crmProject[key];
        }
      });
    } else {
      // If locally modified, only update safe fields
      const safeUpdateFields = ["projectStatus"]; // Add fields that are safe to update even if modified
      safeUpdateFields.forEach((field) => {
        if (crmProject[field] !== undefined) {
          workingProject[field] = crmProject[field];
        }
      });
    }
    workingProject.lastSyncedWithCrm = new Date();
  }

  return workingProject.save();
};

const WorkingProject = mongoose.model("WorkingProject", workingProjectSchema);

module.exports = WorkingProject;
