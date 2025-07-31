// controllers/candidateController.js
const Candidate = require("../models/Candidate");

// Create a new candidate
exports.createCandidate = async (req, res) => {
  try {
    const {
      candidateId,
      fullName,
      gender,
      birthDate,
      maritalStatus,
      address,
      country,
      state,
      city,
      zipCode,
      phoneNo,
      personalMail,
      officialEmail,
      emergencyNo,
      role,
      subRole,
      joiningDate,
      salary,
      company,
      qualification,
      otherQualification,
      aadharCard,
      panCard,
      bankName,
      branchName,
      accountNo,
      ifscCode,
      bankAccountName,
      photoUrl,
      password,
    } = req.body;

    // Validate required fields
    if (
      !candidateId ||
      !personalMail ||
      !fullName ||
      !phoneNo ||
      !role ||
      !subRole ||
      !gender ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Validate personalMail
    if (!personalMail.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Personal email must be valid",
      });
    }

    // Check if candidate with this ID already exists
    const existingCandidate = await Candidate.findOne({ candidateId });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: "Candidate with this ID already exists",
      });
    }

    // Set file paths if files were uploaded
    let cvPath = null;

    if (req.files) {
      if (req.files.cv && req.files.cv.length > 0) {
        cvPath = req.files.cv[0].path.replace(/\\/g, "/");
      }
    }

    // Use the provided officialEmail or generate one
    const email = officialEmail || `${candidateId}@company.com`;

    // Create the candidate object
    const newCandidate = new Candidate({
      candidateId,
      fullName,
      gender,
      birthDate,
      maritalStatus,
      address,
      country,
      state,
      city,
      zipCode,
      phoneNo,
      personalMail, // Match schema field name
      officialEmail, // Add the officialEmail field to the model
      email, // This is the official email for auth
      emergencyNo,
      role,
      subRole,
      joiningDate,
      salary,
      company,
      qualification,
      otherQualification,
      aadharCard,
      panCard,
      bankName,
      branchName,
      accountNo,
      ifscCode,
      photoUrl, // Using Cloudinary URL from frontend
      photoPath: photoUrl, // Set photoPath same as photoUrl for backward compatibility
      cvPath,
      password,
    });

    // Save to database
    await newCandidate.save();

    // Return success response with credentials
    res.status(201).json({
      success: true,
      message: "Candidate registered successfully",
      credentials: {
        candidateId: newCandidate.candidateId,
        email: newCandidate.email,
        password,
      },
    });
  } catch (error) {
    console.error("Error creating candidate:", error);
    res.status(500).json({
      success: false,
      message: "Error creating candidate",
      error: error.message,
    });
  }
};

// Get all candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().select("-password");
    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving candidates",
      error: error.message,
    });
  }
};

// Get a single candidate by ID
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      candidateId: req.params.id,
    }).select("-password");

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.status(200).json({
      success: true,
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving candidate",
      error: error.message,
    });
  }
};

// Update a candidate
exports.updateCandidate = async (req, res) => {
  try {
    let candidate = await Candidate.findOne({ candidateId: req.params.id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Handle file uploads if present
    if (req.files) {
      if (req.files.cv && req.files.cv.length > 0) {
        req.body.cvPath = req.files.cv[0].path.replace(/\\/g, "/");
      }
      // photoUrl should be handled by Cloudinary in the frontend
    }

    // Update candidate
    candidate = await Candidate.findOneAndUpdate(
      { candidateId: req.params.id },
      req.body,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Candidate updated successfully",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating candidate",
      error: error.message,
    });
  }
};

// Delete a candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ candidateId: req.params.id });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Delete the candidate
    await Candidate.findOneAndDelete({ candidateId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting candidate",
      error: error.message,
    });
  }
};

// Login candidate
exports.loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if candidate exists
    const candidate = await Candidate.findOne({ email });
    if (!candidate) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if password matches
    const isMatch = await candidate.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        candidateId: candidate.candidateId,
        fullName: candidate.fullName,
        email: candidate.email,
        role: candidate.role,
        subRole: candidate.subRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Get all employees for task assignment
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Candidate.find({}, {
      _id: 1,
      candidateId: 1,
      fullName: 1,
      personalMail: 1,
      officialEmail: 1,
      email: 1,
      role: 1,
      subRole: 1,
      phoneNo: 1
    }).sort({ fullName: 1 });

    // Format the response for easier use in frontend
    const formattedEmployees = employees.map(emp => ({
      id: emp._id,
      candidateId: emp.candidateId,
      name: emp.fullName,
      email: emp.personalMail || emp.officialEmail || emp.email,
      role: emp.role,
      subRole: emp.subRole,
      phone: emp.phoneNo
    }));

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: formattedEmployees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving employees",
      error: error.message,
    });
  }
};
