const Completion = require("../models/completionModel");
const path = require("path");
const fs = require("fs");

// Create a new completion certificate
const createCompletion = async (req, res) => {
  try {
    const {
      candidateName,
      courseType,
      organizationName,
      duration,
      startDate,
      endDate,
      certID,
      issueDate,
      certificateImageData,
    } = req.body;

    // Create new completion certificate
    const newCompletion = new Completion({
      candidateName,
      courseType,
      organizationName: organizationName || "TARS Technologies",
      duration: duration || "3 Months",
      startDate,
      endDate,
      certID,
      issueDate,
      certificateImageData,
      createdBy: req.userId, // Assuming userId is added by auth middleware
    });

    // If there's image data, convert base64 to buffer and save
    if (certificateImageData) {
      try {
        // Remove the data URL prefix if present
        const base64Data = certificateImageData.replace(/^data:image\/[a-z]+;base64,/, "");
        
        // Convert to buffer
        const imageBuffer = Buffer.from(base64Data, "base64");
        newCompletion.certificateImageBuffer = imageBuffer;

        // Optionally save to file system
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `completion_${certID}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageBuffer);
        newCompletion.certificateImagePath = filename;
      } catch (error) {
        console.error("Error processing certificate image:", error);
        // Continue without saving image if there's an error
      }
    }

    const savedCompletion = await newCompletion.save();
    res.status(201).json({
      success: true,
      message: "Completion certificate created successfully",
      completion: savedCompletion,
    });
  } catch (error) {
    console.error("Error creating completion certificate:", error);
    
    // Handle duplicate certID error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Certificate ID already exists. Please use a unique certificate ID.",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating completion certificate",
      error: error.message,
    });
  }
};

// Get all completion certificates
const getAllCompletions = async (req, res) => {
  try {
    const completions = await Completion.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: completions.length,
      completions,
    });
  } catch (error) {
    console.error("Error fetching completion certificates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching completion certificates",
      error: error.message,
    });
  }
};

// Get completion certificate by ID
const getCompletionById = async (req, res) => {
  try {
    const { id } = req.params;
    const completion = await Completion.findById(id).populate("createdBy", "name email");
    
    if (!completion) {
      return res.status(404).json({
        success: false,
        message: "Completion certificate not found",
      });
    }
    
    res.status(200).json({
      success: true,
      completion,
    });
  } catch (error) {
    console.error("Error fetching completion certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching completion certificate",
      error: error.message,
    });
  }
};

// Get completion certificate by Certificate ID
const getCompletionByCertId = async (req, res) => {
  try {
    const { certId } = req.params;
    const completion = await Completion.findOne({ certID: certId })
      .populate("createdBy", "name email");
    
    if (!completion) {
      return res.status(404).json({
        success: false,
        message: "Completion certificate not found",
      });
    }
    
    res.status(200).json({
      success: true,
      completion,
    });
  } catch (error) {
    console.error("Error fetching completion certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching completion certificate",
      error: error.message,
    });
  }
};

// Update completion certificate
const updateCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const completion = await Completion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
    
    if (!completion) {
      return res.status(404).json({
        success: false,
        message: "Completion certificate not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Completion certificate updated successfully",
      completion,
    });
  } catch (error) {
    console.error("Error updating completion certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error updating completion certificate",
      error: error.message,
    });
  }
};

// Delete completion certificate
const deleteCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const completion = await Completion.findById(id);
    
    if (!completion) {
      return res.status(404).json({
        success: false,
        message: "Completion certificate not found",
      });
    }
    
    // Delete associated image file if exists
    if (completion.certificateImagePath) {
      const filepath = path.join(__dirname, "../uploads", completion.certificateImagePath);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
    
    await Completion.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Completion certificate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting completion certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting completion certificate",
      error: error.message,
    });
  }
};

// Get completion certificates for current user
const getUserCompletions = async (req, res) => {
  try {
    const completions = await Completion.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: completions.length,
      completions,
    });
  } catch (error) {
    console.error("Error fetching user completion certificates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user completion certificates",
      error: error.message,
    });
  }
};

// Download completion certificate image
const downloadCompletionImage = async (req, res) => {
  try {
    const { id } = req.params;
    const completion = await Completion.findById(id);
    
    if (!completion) {
      return res.status(404).json({
        success: false,
        message: "Completion certificate not found",
      });
    }
    
    if (!completion.certificateImagePath) {
      return res.status(404).json({
        success: false,
        message: "Certificate image not found",
      });
    }
    
    const filepath = path.join(__dirname, "../uploads", completion.certificateImagePath);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: "Certificate image file not found",
      });
    }
    
    res.download(filepath, `completion_${completion.certID}.png`, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).json({
          success: false,
          message: "Error downloading certificate image",
        });
      }
    });
  } catch (error) {
    console.error("Error downloading completion certificate image:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading completion certificate image",
      error: error.message,
    });
  }
};

// Get completion statistics
const getCompletionStats = async (req, res) => {
  try {
    const totalCompletions = await Completion.countDocuments();
    
    const courseTypeStats = await Completion.aggregate([
      {
        $group: {
          _id: "$courseType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const gradeStats = await Completion.aggregate([
      {
        $group: {
          _id: "$grade",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const durationStats = await Completion.aggregate([
      {
        $group: {
          _id: "$duration",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const monthlyStats = await Completion.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": -1, "_id.month": -1 },
      },
      {
        $limit: 12,
      },
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalCompletions,
        courseTypeStats,
        durationStats,
      },
    });
  } catch (error) {
    console.error("Error fetching completion statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching completion statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createCompletion,
  getAllCompletions,
  getCompletionById,
  getCompletionByCertId,
  updateCompletion,
  deleteCompletion,
  getUserCompletions,
  downloadCompletionImage,
  getCompletionStats,
};
