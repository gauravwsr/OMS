const mongoose = require("mongoose");

// Define Certificate schema
const CertificateSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
  },
  collegeName: {
    type: String,
    required: true,
  },
  internshipType: {
    type: String,
    required: true,
    enum: [
      "Web Development",
      "UI/UX",
      "Cloud Computing",
      "DevOps",
      "IoT",
      "Social Media Marketing",
    ],
  },
  companyName: {
    type: String,
    required: true,
    default: "TARS Technologies",
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
CertificateSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Certificate", CertificateSchema);
