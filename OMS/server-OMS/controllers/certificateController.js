const Certificate = require("../models/certificateModel");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

// Create a new certificate
const createCertificate = async (req, res) => {
  try {
    const {
      candidateName,
      collegeName,
      internshipType,
      companyName,
      startDate,
      endDate,
      certID,
      issueDate,
      certificateImageData, // Base64 image data
    } = req.body;

    // Check if certificate ID already exists
    const existingCertificate = await Certificate.findOne({ certID });
    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: "Certificate with this ID already exists",
      });
    }

    // Create certificate object
    const certificateData = {
      candidateName,
      collegeName,
      internshipType,
      companyName: companyName || "TARS Technologies",
      startDate,
      endDate,
      certID,
      issueDate,
      createdBy: req.user ? req.user.id : null,
    };

    // If certificate image data is provided, save it
    if (certificateImageData) {
      try {
        // Remove data URL prefix if present
        const base64Data = certificateImageData.replace(/^data:image\/[a-z]+;base64,/, "");
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        // Create filename with certificate ID and timestamp
        const fileName = `certificate_${certID}_${Date.now()}.png`;
        const uploadDir = path.join(__dirname, "../uploads/certificates");
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, fileName);
        
        // Save file to disk
        await promisify(fs.writeFile)(filePath, imageBuffer);
        
        // Store both the file path and the image data
        certificateData.certificateImagePath = `/uploads/certificates/${fileName}`;
        certificateData.certificateImageBuffer = imageBuffer;
        certificateData.certificateImageData = certificateImageData;
        
      } catch (imageError) {
        console.error("Error saving certificate image:", imageError);
        // Continue without saving image if there's an error
      }
    }

    // Save certificate to database
    const certificate = new Certificate(certificateData);
    await certificate.save();

    res.status(201).json({
      success: true,
      message: "Certificate created successfully",
      certificate: {
        ...certificate.toObject(),
        certificateImageBuffer: undefined, // Don't send buffer in response
      },
    });
  } catch (error) {
    console.error("Error creating certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error creating certificate",
      error: error.message,
    });
  }
};

// Get all certificates
const getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate("createdBy", "name email")
      .select("-certificateImageBuffer") // Exclude buffer from response
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching certificates",
      error: error.message,
    });
  }
};

// Get certificate by ID
const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id)
      .populate("createdBy", "name email")
      .select("-certificateImageBuffer"); // Exclude buffer from response

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching certificate",
      error: error.message,
    });
  }
};

// Get certificate by Certificate ID
const getCertificateByCertId = async (req, res) => {
  try {
    const { certId } = req.params;

    const certificate = await Certificate.findOne({ certID: certId })
      .populate("createdBy", "name email")
      .select("-certificateImageBuffer"); // Exclude buffer from response

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error("Error fetching certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching certificate",
      error: error.message,
    });
  }
};

// Update certificate
const updateCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Handle certificate image update if provided
    if (updateData.certificateImageData) {
      try {
        const base64Data = updateData.certificateImageData.replace(/^data:image\/[a-z]+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        
        const fileName = `certificate_${updateData.certID || id}_${Date.now()}.png`;
        const uploadDir = path.join(__dirname, "../uploads/certificates");
        
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, fileName);
        await promisify(fs.writeFile)(filePath, imageBuffer);
        
        updateData.certificateImagePath = `/uploads/certificates/${fileName}`;
        updateData.certificateImageBuffer = imageBuffer;
      } catch (imageError) {
        console.error("Error updating certificate image:", imageError);
      }
    }

    const certificate = await Certificate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email").select("-certificateImageBuffer");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Certificate updated successfully",
      certificate,
    });
  } catch (error) {
    console.error("Error updating certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error updating certificate",
      error: error.message,
    });
  }
};

// Delete certificate
const deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    // Delete associated image file if exists
    if (certificate.certificateImagePath) {
      const fullPath = path.join(__dirname, "..", certificate.certificateImagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Certificate.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting certificate:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting certificate",
      error: error.message,
    });
  }
};

// Get certificate image
const getCertificateImage = async (req, res) => {
  try {
    const { id } = req.params;

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    if (!certificate.certificateImageData) {
      return res.status(404).json({
        success: false,
        message: "Certificate image not found",
      });
    }

    // Return base64 image data
    res.status(200).json({
      success: true,
      imageData: certificate.certificateImageData,
    });
  } catch (error) {
    console.error("Error fetching certificate image:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching certificate image",
      error: error.message,
    });
  }
};

module.exports = {
  createCertificate,
  getAllCertificates,
  getCertificateById,
  getCertificateByCertId,
  updateCertificate,
  deleteCertificate,
  getCertificateImage,
};
