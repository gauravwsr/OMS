const mongoose = require("mongoose");

const chargeHandoverSchema = new mongoose.Schema(
  {
    fromEmployeeId: {
      type: String, // Candidate ID from Candidate schema
      required: true,
      index: true,
    },
    toEmployeeId: {
      type: String, // Candidate ID from Candidate schema
      required: true,
      index: true,
    },
    handoverDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: String,
      default: "",
    },
    assets: {
      type: String,
      default: "",
    },
    documents: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    comments: [
      {
        userId: String,
        comment: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chargeHandoverSchema.index({ createdBy: 1, createdAt: -1 });
chargeHandoverSchema.index({ fromEmployeeId: 1, toEmployeeId: 1 });
chargeHandoverSchema.index({ status: 1, handoverDate: 1 });

const ChargeHandover = mongoose.model("ChargeHandover", chargeHandoverSchema);

module.exports = ChargeHandover;
