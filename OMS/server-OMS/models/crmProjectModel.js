const mongoose = require("mongoose");

// Schema for storing original CRM data (read-only)
const crmProjectSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    projectId: {
      type: String,
      required: true,
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
    // Original CRM data fields
    description: {
      type: String,
      trim: true,
    },
    budget: {
      type: Number,
      min: 0,
      default: 0,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    technologies: [
      {
        type: String,
        trim: true,
      },
    ],
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
    tasks: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      inProgress: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    // Metadata for tracking
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    syncSource: {
      type: String,
      default: "CRM",
    },
    // Raw data from CRM for reference
    rawData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
crmProjectSchema.index({ externalId: 1 }, { unique: true });
crmProjectSchema.index({ projectId: 1 });
crmProjectSchema.index({ lastSyncedAt: 1 });

const CrmProject = mongoose.model("CrmProject", crmProjectSchema);

module.exports = CrmProject;
