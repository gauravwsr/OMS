const mongoose = require('mongoose');

const teamLeadHistorySchema = new mongoose.Schema({
  teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamLeadName: String,
  assignedDate: String,   // Format: YYYY-MM-DD
  unassignedDate: String  // Format: YYYY-MM-DD
}, { _id: false });

const clientProjectSchema = new mongoose.Schema({
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
    enum: ['Active', 'Completed', 'Overdue', 'Pending', 'On Hold'],
    default: 'Pending',
  },
  projectPassword: {
    type: String,
    required: true,
  },
  // Team Lead Assignment fields
  assignedTeamLead: {
    type: String,
    default: null,
    trim: true,
  },
  teamLeadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedDate: {
    type: Date,
    default: null,
  },
  // External API tracking
  externalId: {
    type: String,
    trim: true,
    index: true, // For faster lookups when syncing
  },
  // Additional project details
  description: {
    type: String,
    trim: true,
  },
  requirements: {
    type: String,
    trim: true,
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
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
  // Budget tracking
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
  // Project milestones
  milestones: [{
    name: String,
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    dueDate: Date,
    completedDate: Date
  }],
  // Risk assessment
  risks: [{
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    description: String,
    mitigationPlan: String
  }],
  // Task tracking
  tasks: {
    total: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    inProgress: { type: Number, default: 0 },
    pending: { type: Number, default: 0 }
  },
  // Contact information
  clientContact: {
    name: String,
    email: String,
    phone: String,
  },
  // Project files and documents
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Project notes and comments
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  teamLeadHistory: [teamLeadHistorySchema], // <-- Add this line
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

// Indexes for better query performance
clientProjectSchema.index({ projectId: 1 });
clientProjectSchema.index({ assignedTeamLead: 1 });
clientProjectSchema.index({ teamLeadId: 1 });
clientProjectSchema.index({ projectStatus: 1 });
clientProjectSchema.index({ leadName: 1 });
clientProjectSchema.index({ clientName: 1 });

// Pre-save middleware to update assignedDate when team lead is assigned
clientProjectSchema.pre('save', function(next) {
  if (this.isModified('assignedTeamLead') && this.assignedTeamLead && !this.assignedDate) {
    this.assignedDate = new Date();
  }
  next();
});

// Instance method to assign team lead
clientProjectSchema.methods.assignTeamLead = function(teamLeadName, teamLeadId, assignedById) {
  this.assignedTeamLead = teamLeadName;
  this.teamLeadId = teamLeadId;
  this.assignedBy = assignedById;
  this.assignedDate = new Date();
  return this.save();
};

// Static method to get projects assigned to a specific team lead
clientProjectSchema.statics.getProjectsForTeamLead = function(teamLeadIdentifier) {
  return this.find({
    $or: [
      { assignedTeamLead: teamLeadIdentifier },
      { teamLeadId: teamLeadIdentifier },
      { leadName: teamLeadIdentifier }
    ]
  }).populate('teamLeadId', 'name email subRole')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get all projects with populated team lead info
clientProjectSchema.statics.getAllWithTeamLeads = function() {
  return this.find({})
    .populate('teamLeadId', 'name email subRole specialization')
    .populate('assignedBy', 'name email')
    .sort({ createdAt: -1 });
};

const ClientProject = mongoose.model('ClientProject', clientProjectSchema);

module.exports = ClientProject;
