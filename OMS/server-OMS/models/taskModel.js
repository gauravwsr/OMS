const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WorkingProject",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  assignedTo: [
    {
      employeeId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: false, default: '' }, // Made email optional with default
      role: { type: String },
      assignedAt: { type: Date, default: Date.now },
    },
  ],
  assignedBy: {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  taskPoints: [
    {
      pointTitle: { type: String, required: true },
      description: { type: String },
      isCompleted: { type: Boolean, default: false },
      completedBy: { type: String },
      completedAt: { type: Date },
      order: { type: Number, default: 0 },
    },
  ],
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  dueDate: { type: Date },
  completedAt: { type: Date },
  progressPercentage: { type: Number, default: 0 },
  comments: [
    {
      commentBy: { type: String },
      comment: { type: String },
      commentAt: { type: Date, default: Date.now },
    },
  ],
  statusHistory: [
    {
      previousStatus: { type: String },
      newStatus: { type: String, required: true },
      changedBy: {
        employeeId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String },
        role: { type: String }
      },
      changedAt: { type: Date, default: Date.now },
      reason: { type: String }, // Optional reason for the status change
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate progress percentage based on completed task points
taskSchema.methods.calculateProgress = function () {
  if (this.taskPoints.length === 0) {
    this.progressPercentage = 0;
  } else {
    const completedPoints = this.taskPoints.filter(
      (point) => point.isCompleted
    ).length;
    this.progressPercentage = Math.round(
      (completedPoints / this.taskPoints.length) * 100
    );
  }

  // Only auto-update status if not manually set
  // This prevents overriding manual status changes when reopening tasks
  if (this.progressPercentage === 100 && this.status !== "In Progress" && this.status !== "Pending") {
    this.status = "Completed";
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.progressPercentage > 0 && this.status === "Pending") {
    // Only auto-move from Pending to In Progress, don't override manual changes
    this.status = "In Progress";
  }

  return this.progressPercentage;
};

module.exports = mongoose.model("Task", taskSchema);
