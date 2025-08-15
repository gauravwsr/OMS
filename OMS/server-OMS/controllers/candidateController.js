// controllers/candidateController.js
const Candidate = require("../models/Candidate");

// Create a new candidate
exports.createCandidate = async (req, res) => {
  try {
    console.log("=== CREATE CANDIDATE DEBUG ===");
    console.log("Request headers:", req.headers);
    console.log("Request method:", req.method);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Received request body:", req.body);
    console.log("Received files:", req.files);
    console.log("Request body keys:", Object.keys(req.body || {}));
    console.log("=== END DEBUG ===");

    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error("ERROR: Request body is empty or undefined");
      return res.status(400).json({
        success: false,
        message: "Request body is empty. Check multipart form data processing.",
        debug: {
          bodyType: typeof req.body,
          bodyKeys: Object.keys(req.body || {}),
          hasFiles: !!req.files,
          contentType: req.headers["content-type"],
        },
      });
    }

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
      console.log("Missing required fields:", {
        candidateId: !!candidateId,
        personalMail: !!personalMail,
        fullName: !!fullName,
        phoneNo: !!phoneNo,
        role: !!role,
        subRole: !!subRole,
        gender: !!gender,
        password: !!password,
      });
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
      bankAccountName,
      photoUrl, // Using Cloudinary URL from frontend
      photoPath: photoUrl, // Set photoPath same as photoUrl for backward compatibility
      cvPath,
      password,
    });

    // Save to database
    console.log("Attempting to save candidate:", newCandidate);
    await newCandidate.save();
    console.log("Candidate saved successfully:", newCandidate._id);

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

    // Delete face recognition images from face recognition server
    if (candidate.fullName) {
      try {
        const axios = require("axios");

        // Call face recognition server to delete user images
        const faceDeleteResponse = await axios.delete(
          `http://146.190.165.62:5002/api/delete-user/${encodeURIComponent(
            candidate.fullName
          )}`,
          { timeout: 5000 }
        );

        if (faceDeleteResponse.status === 200) {
          console.log(
            `✅ Face recognition images deleted for: ${candidate.fullName}`
          );
        } else {
          console.log(
            `⚠️ Face recognition server responded with: ${faceDeleteResponse.status}`
          );
        }
      } catch (faceError) {
        console.error(
          `❌ Error deleting face images for ${candidate.fullName}:`,
          faceError.message
        );
        // Continue with deletion even if face server is not available
      }
    }

    // Delete uploaded files if they exist
    const fs = require("fs");
    const path = require("path");

    try {
      // Delete CV file if exists
      if (candidate.cvPath && fs.existsSync(candidate.cvPath)) {
        fs.unlinkSync(candidate.cvPath);
        console.log(`✅ CV file deleted: ${candidate.cvPath}`);
      }

      // Delete photo file if exists (if stored locally)
      if (candidate.photoPath && fs.existsSync(candidate.photoPath)) {
        fs.unlinkSync(candidate.photoPath);
        console.log(`✅ Photo file deleted: ${candidate.photoPath}`);
      }
    } catch (fileError) {
      console.error(
        `❌ Error deleting files for ${candidate.fullName}:`,
        fileError.message
      );
      // Continue with deletion even if file deletion fails
    }

    // Delete the candidate from database
    await Candidate.findOneAndDelete({ candidateId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Candidate and associated files deleted successfully",
      deletedData: {
        candidateId: candidate.candidateId,
        fullName: candidate.fullName,
        faceImagesDeleted: !!candidate.fullName,
        filesDeleted: !!(candidate.cvPath || candidate.photoPath),
      },
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
    const employees = await Candidate.find(
      {},
      {
        _id: 1,
        candidateId: 1,
        fullName: 1,
        personalMail: 1,
        officialEmail: 1,
        email: 1,
        role: 1,
        subRole: 1,
        phoneNo: 1,
      }
    ).sort({ fullName: 1 });

    // Format the response for easier use in frontend
    const formattedEmployees = employees.map((emp) => ({
      id: emp._id,
      candidateId: emp.candidateId,
      name: emp.fullName,
      email: emp.personalMail || emp.officialEmail || emp.email,
      role: emp.role,
      subRole: emp.subRole,
      phone: emp.phoneNo,
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

// Mark attendance using face recognition
exports.markAttendance = async (req, res) => {
  try {
    const { candidateId, status, timestamp } = req.body;

    if (!candidateId || !status) {
      return res.status(400).json({
        success: false,
        message: "Candidate ID and status are required",
      });
    }

    const candidate = await Candidate.findOne({ candidateId });
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    const today = new Date();
    const todayDate = today.toDateString();

    // Check if attendance is already marked today
    const todayAttendance = candidate.attendanceHistory.find(
      (record) => new Date(record.date).toDateString() === todayDate
    );

    if (todayAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    // Update attendance fields
    candidate.attendanceMark = status;
    candidate.lastAttendanceDate = timestamp || new Date();

    if (status === "Present" || status === "On Time" || status === "Late") {
      candidate.totalPresentDays += 1;
    }

    // Add to attendance history
    candidate.attendanceHistory.push({
      date: new Date(),
      status: status,
      timestamp: timestamp || new Date(),
    });

    candidate.updatedAt = new Date();
    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        candidateId: candidate.candidateId,
        fullName: candidate.fullName,
        status: status,
        totalPresentDays: candidate.totalPresentDays,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking attendance",
      error: error.message,
    });
  }
};

// Get attendance history for a candidate
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 30 } = req.query;

    const candidate = await Candidate.findOne({ candidateId: id }).select(
      "candidateId fullName attendanceMark lastAttendanceDate totalPresentDays attendanceHistory"
    );

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Sort attendance history by date (newest first) and limit results
    const history = candidate.attendanceHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        candidateId: candidate.candidateId,
        fullName: candidate.fullName,
        currentStatus: candidate.attendanceMark,
        lastAttendanceDate: candidate.lastAttendanceDate,
        totalPresentDays: candidate.totalPresentDays,
        history: history,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving attendance history",
      error: error.message,
    });
  }
};

// Update face encodings for a candidate
exports.updateFaceEncodings = async (req, res) => {
  try {
    const { id } = req.params;
    const { faceEncodings, faceImagePaths } = req.body;

    if (!faceEncodings || !Array.isArray(faceEncodings)) {
      return res.status(400).json({
        success: false,
        message: "Face encodings array is required",
      });
    }

    const candidate = await Candidate.findOne({ candidateId: id });
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    candidate.faceEncodings = faceEncodings;
    if (faceImagePaths && Array.isArray(faceImagePaths)) {
      candidate.faceImagePaths = faceImagePaths;
    }
    candidate.updatedAt = new Date();

    await candidate.save();

    res.status(200).json({
      success: true,
      message: "Face encodings updated successfully",
      data: {
        candidateId: candidate.candidateId,
        fullName: candidate.fullName,
        faceEncodingsCount: candidate.faceEncodings.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating face encodings",
      error: error.message,
    });
  }
};

// Get all attendance records (for admin dashboard)
exports.getAllAttendanceRecords = async (req, res) => {
  try {
    const { date, status, limit = 100 } = req.query;

    let matchCondition = {};

    // Filter by date if provided
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      matchCondition["attendanceHistory.date"] = {
        $gte: targetDate,
        $lt: nextDay,
      };
    }

    // Filter by status if provided
    if (status && status !== "all") {
      matchCondition["attendanceHistory.status"] = status;
    }

    const candidates = await Candidate.find(matchCondition)
      .select(
        "candidateId fullName role subRole attendanceMark lastAttendanceDate totalPresentDays attendanceHistory"
      )
      .limit(parseInt(limit))
      .sort({ lastAttendanceDate: -1 });

    const formattedRecords = candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      fullName: candidate.fullName,
      role: candidate.role,
      subRole: candidate.subRole,
      currentStatus: candidate.attendanceMark,
      lastAttendanceDate: candidate.lastAttendanceDate,
      totalPresentDays: candidate.totalPresentDays,
      recentHistory: candidate.attendanceHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5), // Last 5 records
    }));

    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      data: formattedRecords,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving attendance records",
      error: error.message,
    });
  }
};

// Download CV/Resume function
exports.downloadCV = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 Downloading CV for candidate:', id);
    
    // Find the candidate
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    if (!candidate.cvPath) {
      return res.status(404).json({
        success: false,
        message: 'CV not found for this candidate'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if CV file is a URL (Cloudinary) or local path
    if (candidate.cvPath.startsWith('http')) {
      // Cloudinary URL - redirect or proxy
      console.log('☁️ CV is stored in Cloudinary:', candidate.cvPath);
      
      // For Cloudinary files, we can redirect or use our proxy
      const axios = require('axios');
      
      try {
        const response = await axios.get(candidate.cvPath, { responseType: 'stream' });
        
        // Set appropriate headers
        const contentType = response.headers['content-type'] || 'application/pdf';
        const filename = `${candidate.fullName}_CV.${contentType.includes('pdf') ? 'pdf' : 'doc'}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Pipe the file stream to response
        response.data.pipe(res);
        
      } catch (cloudinaryError) {
        console.error('Error downloading from Cloudinary:', cloudinaryError);
        return res.status(500).json({
          success: false,
          message: 'Failed to download CV from cloud storage',
          error: cloudinaryError.message
        });
      }
      
    } else {
      // Local file path
      const fullPath = path.resolve(candidate.cvPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          message: 'CV file not found on server'
        });
      }
      
      // Get file info
      const filename = path.basename(fullPath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.doc') contentType = 'application/msword';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Set headers and send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${candidate.fullName}_CV${ext}"`);
      res.sendFile(fullPath);
    }
    
  } catch (error) {
    console.error('Error downloading CV:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading CV',
      error: error.message
    });
  }
};

// Download any document function
exports.downloadDocument = async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    console.log(`📄 Downloading ${documentType} for candidate:`, id);
    
    // Find the candidate
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Map document types to candidate fields
    const documentMap = {
      'cv': 'cvPath',
      'resume': 'cvPath',
      'photo': 'photoPath',
      'governmentId': 'document_governmentId',
      'panCard': 'document_panCard',
      'passportPhoto': 'document_passportPhoto',
      'signedOfferLetter': 'document_signedOfferLetter',
      'nda': 'document_nda',
      'addressProof': 'document_addressProof',
      'educationalCertificates': 'document_educationalCertificates',
      'experienceCertificates': 'document_experienceCertificates',
      'salarySlips': 'document_salarySlips',
      'bankDetails': 'document_bankDetails',
      'joiningForm': 'document_joiningForm',
      'medicalCertificate': 'document_medicalCertificate',
      'collegeId': 'document_collegeId',
      'bonafideCertificate': 'document_bonafideCertificate',
      'letterOfRecommendation': 'document_letterOfRecommendation',
      'transcripts': 'document_transcripts',
      'portfolioSamples': 'document_portfolioSamples'
    };
    
    const fieldName = documentMap[documentType];
    
    if (!fieldName || !candidate[fieldName]) {
      return res.status(404).json({
        success: false,
        message: `${documentType} not found for this candidate`
      });
    }
    
    const documentPath = candidate[fieldName];
    const fs = require('fs');
    const path = require('path');
    
    // Check if document file is a URL (Cloudinary) or local path
    if (documentPath.startsWith('http')) {
      // Cloudinary URL - proxy download
      console.log(`☁️ ${documentType} is stored in Cloudinary:`, documentPath);
      
      const axios = require('axios');
      
      try {
        const response = await axios.get(documentPath, { responseType: 'stream' });
        
        // Set appropriate headers
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const filename = `${candidate.fullName}_${documentType}.${contentType.includes('pdf') ? 'pdf' : contentType.includes('image') ? 'jpg' : 'doc'}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Pipe the file stream to response
        response.data.pipe(res);
        
      } catch (cloudinaryError) {
        console.error(`Error downloading ${documentType} from Cloudinary:`, cloudinaryError);
        return res.status(500).json({
          success: false,
          message: `Failed to download ${documentType} from cloud storage`,
          error: cloudinaryError.message
        });
      }
      
    } else {
      // Local file path
      const fullPath = path.resolve(documentPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          message: `${documentType} file not found on server`
        });
      }
      
      // Get file info
      const filename = path.basename(fullPath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.doc') contentType = 'application/msword';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) contentType = `image/${ext.substring(1)}`;
      
      // Set headers and send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${candidate.fullName}_${documentType}${ext}"`);
      res.sendFile(fullPath);
    }
    
  } catch (error) {
    console.error(`Error downloading ${documentType}:`, error);
    res.status(500).json({
      success: false,
      message: `Error downloading ${documentType}`,
      error: error.message
    });
  }
};

// Download CV/Resume function
exports.downloadCV = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 Downloading CV for candidate:', id);
    
    // Find the candidate
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    if (!candidate.cvPath) {
      return res.status(404).json({
        success: false,
        message: 'CV not found for this candidate'
      });
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if CV file is a URL (Cloudinary) or local path
    if (candidate.cvPath.startsWith('http')) {
      // Cloudinary URL - redirect or proxy
      console.log('☁️ CV is stored in Cloudinary:', candidate.cvPath);
      
      // For Cloudinary files, we can redirect or use our proxy
      const axios = require('axios');
      
      try {
        const response = await axios.get(candidate.cvPath, { responseType: 'stream' });
        
        // Set appropriate headers
        const contentType = response.headers['content-type'] || 'application/pdf';
        const filename = `${candidate.fullName}_CV.${contentType.includes('pdf') ? 'pdf' : 'doc'}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Pipe the file stream to response
        response.data.pipe(res);
        
      } catch (cloudinaryError) {
        console.error('Error downloading from Cloudinary:', cloudinaryError);
        return res.status(500).json({
          success: false,
          message: 'Failed to download CV from cloud storage',
          error: cloudinaryError.message
        });
      }
      
    } else {
      // Local file path
      const fullPath = path.resolve(candidate.cvPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          message: 'CV file not found on server'
        });
      }
      
      // Get file info
      const filename = path.basename(fullPath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.doc') contentType = 'application/msword';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      // Set headers and send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${candidate.fullName}_CV${ext}"`);
      res.sendFile(fullPath);
    }
    
  } catch (error) {
    console.error('Error downloading CV:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading CV',
      error: error.message
    });
  }
};

// Download any document function
exports.downloadDocument = async (req, res) => {
  try {
    const { id, documentType } = req.params;
    
    console.log(`📄 Downloading ${documentType} for candidate:`, id);
    
    // Find the candidate
    const candidate = await Candidate.findById(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Map document types to candidate fields
    const documentMap = {
      'cv': 'cvPath',
      'resume': 'cvPath',
      'photo': 'photoPath',
      'governmentId': 'document_governmentId',
      'panCard': 'document_panCard',
      'passportPhoto': 'document_passportPhoto',
      'signedOfferLetter': 'document_signedOfferLetter',
      'nda': 'document_nda',
      'addressProof': 'document_addressProof',
      'educationalCertificates': 'document_educationalCertificates',
      'experienceCertificates': 'document_experienceCertificates',
      'salarySlips': 'document_salarySlips',
      'bankDetails': 'document_bankDetails',
      'joiningForm': 'document_joiningForm',
      'medicalCertificate': 'document_medicalCertificate',
      'collegeId': 'document_collegeId',
      'bonafideCertificate': 'document_bonafideCertificate',
      'letterOfRecommendation': 'document_letterOfRecommendation',
      'transcripts': 'document_transcripts',
      'portfolioSamples': 'document_portfolioSamples'
    };
    
    const fieldName = documentMap[documentType];
    
    if (!fieldName || !candidate[fieldName]) {
      return res.status(404).json({
        success: false,
        message: `${documentType} not found for this candidate`
      });
    }
    
    const documentPath = candidate[fieldName];
    const fs = require('fs');
    const path = require('path');
    
    // Check if document file is a URL (Cloudinary) or local path
    if (documentPath.startsWith('http')) {
      // Cloudinary URL - proxy download
      console.log(`☁️ ${documentType} is stored in Cloudinary:`, documentPath);
      
      const axios = require('axios');
      
      try {
        const response = await axios.get(documentPath, { responseType: 'stream' });
        
        // Set appropriate headers
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        const filename = `${candidate.fullName}_${documentType}.${contentType.includes('pdf') ? 'pdf' : contentType.includes('image') ? 'jpg' : 'doc'}`;
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Pipe the file stream to response
        response.data.pipe(res);
        
      } catch (cloudinaryError) {
        console.error(`Error downloading ${documentType} from Cloudinary:`, cloudinaryError);
        return res.status(500).json({
          success: false,
          message: `Failed to download ${documentType} from cloud storage`,
          error: cloudinaryError.message
        });
      }
      
    } else {
      // Local file path
      const fullPath = path.resolve(documentPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          message: `${documentType} file not found on server`
        });
      }
      
      // Get file info
      const filename = path.basename(fullPath);
      const ext = path.extname(filename).toLowerCase();
      
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.doc') contentType = 'application/msword';
      else if (ext === '.docx') contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) contentType = `image/${ext.substring(1)}`;
      
      // Set headers and send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${candidate.fullName}_${documentType}${ext}"`);
      res.sendFile(fullPath);
    }
    
  } catch (error) {
    console.error(`Error downloading ${documentType}:`, error);
    res.status(500).json({
      success: false,
      message: `Error downloading ${documentType}`,
      error: error.message
    });
  }
};
