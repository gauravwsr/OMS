// models/Candidate.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const candidateSchema = new mongoose.Schema({
  candidateId: {
    type: String,
    required: true,
    unique: true
  },
  photoUrl: {
    type: String,
    default: null
  },
  fullName: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  role: String,
  subRole: String,
  qualification: String,
  otherQualification: String,
  birthDate: Date,
  address: String,
  maritalStatus: String,
  country: String,
  state: String,
  city: String,
  phoneNo: {
    type: String,
    required: true
  },
  zipCode: String,
  emergencyNo: String,
  officialEmail: String,
  personalMail: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  aadharCard: String,
  joiningDate: Date,
  panCard: String,
  branchName: String,
  bankName: String,
  ifscCode: String,
  accountNo: String,
  photoPath: String,
  cvPath: String,
  // Auth related fields
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  passwordPlain: String, // Temporary storage for showing in the modal
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
candidateSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Store the plain password temporarily for displaying in the credentials modal
    this.passwordPlain = this.password;
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
candidateSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;