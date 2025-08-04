const mongoose = require("mongoose");

// Define Offer Letter schema
const OfferSchema = new mongoose.Schema({
  candidateName: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
    enum: [
      "Software Developer",
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "UI/UX Designer",
      "Data Scientist",
      "DevOps Engineer",
      "QA Engineer",
      "Project Manager",
      "Business Analyst",
      "Digital Marketing Executive",
      "HR Executive",
    ],
  },
  joiningDate: {
    type: String,
    required: true,
  },
  offerID: {
    type: String,
    required: true,
    unique: true,
  },
  issueDate: {
    type: String,
    required: true,
  },
  offerImagePath: {
    type: String, // Store the path to the saved offer image
  },
  offerImageBuffer: {
    type: Buffer, // Store the actual image data as buffer
  },
  offerImageData: {
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
OfferSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Offer", OfferSchema);
