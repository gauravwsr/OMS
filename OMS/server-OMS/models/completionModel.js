const mongoose = require("mongoose");

// Define Completion Certificate schema
const CompletionSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
  },
  courseType: {
    type: String,
    required: true,
    enum: [
      "Web Development Course",
      "UI/UX Design Course",
      "Cloud Computing Course",
      "DevOps Training",
      "IoT Development Course",
      "Digital Marketing Course",
      "Data Science Course",
      "Mobile App Development",
      "Cybersecurity Course",
      "Machine Learning Course",
    ],
  },
  organizationName: {
    type: String,
    required: true,
    default: "TARS Technologies",
  },
  duration: {
    type: String,
    required: true,
    default: "3 Months",
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  certID: {
    type: String,
    required: true,
    unique: true,
  },
  issueDate: {
    type: String,
    required: true,
  },
  certificateImagePath: {
    type: String, // Store the path to the saved certificate image
  },
  certificateImageBuffer: {
    type: Buffer, // Store the actual image data as buffer
  },
  certificateImageData: {
    type: String, // Store base64 image data
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
CompletionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Completion", CompletionSchema);
