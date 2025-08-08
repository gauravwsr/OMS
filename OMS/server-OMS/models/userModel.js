const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define User schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: Number,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["Super_Admin", "Admin", "Employee", "Intern"],
  },
  subRole: {
    type: String,
    enum: [
      "CEO",
      "COO",
      "CFO",
      "HR",
      "HR Coordinator",
      "HR Executive",
      "HR Manager",
      "HR Intern",
      "IT Intern",
      "IT Executive",
      "Network Admin",
      "IT Manager",
      "Team Leader",
      "Manager",
      "Developer",
      "App Developer",
      "UI/UX Designer",
      "QA/Tester",
      "Designer",
      "Team Lead",
      "Project Manager",
      "Delivery Manager",
    ],
  },
  // Personal Information
  phoneNumber: {
    type: String,
  },
  emergencyContact: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  address: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  zipCode: {
    type: String,
  },
  // Professional Information
  employeeId: {
    type: String,
    unique: true,
  },
  // Current department and position fields
  department: {
    type: String,
    enum: ["HR", "IT", "Information Technology", "Employee", "Project"],
  },
  position: {
    type: String,
  },
  specialization: {
    type: String,
  },
  joiningDate: {
    type: Date,
  },
  qualification: {
    type: String,
    enum: [
      "High School",
      "Bachelor's Degree",
      "Master's Degree",
      "PhD",
      "Diploma",
      "Professional Certification",
    ],
  },
  experience: {
    type: String,
    enum: ["0-1 years", "1-3 years", "3-5 years", "5-10 years", "10+ years"],
  },
  salary: {
    type: Number,
  },
  // Role Information (organizational structure)
  organizationalDepartment: {
    type: String, // Department (HR, IT, Finance, etc.)
  },
  organizationalPosition: {
    type: String, // Position (HR Manager, Developer, etc.)
  },
  organizationalSpecialization: {
    type: String, // Specialization (Hardware Support, etc.)
  },
  // Team assignment for meeting access control
  team: {
    type: String,
    trim: true,
    default: null,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  // Email Configuration for Hostinger
  emailConfig: {
    smtpEmail: {
      type: String,
      default: null, // e.g., user@tars.co.in
    },
    smtpPassword: {
      type: String,
      default: null, // Encrypted password
    },
    isEmailConfigured: {
      type: Boolean,
      default: false,
    },
    lastEmailSync: {
      type: Date,
      default: null,
    },
  },
});

// Hash password before saving
// UserSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) {
//       next();
//     }
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   });

//   // Method to check if password matches
//   UserSchema.methods.matchPassword = async function(enteredPassword) {
//     return await bcrypt.compare(enteredPassword, this.password);
//   };

module.exports = mongoose.model("User", UserSchema);
