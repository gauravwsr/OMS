const Offer = require("../models/offerModel");
const path = require("path");
const fs = require("fs");

// Create a new offer letter
const createOffer = async (req, res) => {
  try {
    const {
      candidateName,
      position,
      joiningDate,
      offerID,
      issueDate,
      offerImageData
    } = req.body;

    // Create new offer letter
    const newOffer = new Offer({
      candidateName,
      position,
      joiningDate,
      offerID,
      issueDate,
      offerImageData,
    });
    //   hrTitle: hrTitle || "HR Manager",
    //   offerID,
    //   issueDate,
    //   validUntil,
    //   offerImageData,
    //   createdBy: req.userId, // Assuming userId is added by auth middleware
    // });

    // If there's image data, convert base64 to buffer and save
    if (offerImageData) {
      try {
        // Remove the data URL prefix if present
        const base64Data = offerImageData.replace(/^data:image\/[a-z]+;base64,/, "");
        
        // Convert to buffer
        const imageBuffer = Buffer.from(base64Data, "base64");
        newOffer.offerImageBuffer = imageBuffer;

        // Optionally save to file system
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const filename = `offer_${offerID}_${Date.now()}.png`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, imageBuffer);
        newOffer.offerImagePath = filename;
      } catch (error) {
        console.error("Error processing offer image:", error);
        // Continue without saving image if there's an error
      }
    }

    const savedOffer = await newOffer.save();
    res.status(201).json({
      success: true,
      message: "Offer letter created successfully",
      offer: savedOffer,
    });
  } catch (error) {
    console.error("Error creating offer letter:", error);
    
    // Handle duplicate offerID error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Offer ID already exists. Please use a unique offer ID.",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating offer letter",
      error: error.message,
    });
  }
};

// Get all offer letters
const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Error fetching offer letters:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching offer letters",
      error: error.message,
    });
  }
};

// Get offer letter by ID
const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id).populate("createdBy", "name email");
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer letter not found",
      });
    }
    
    res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Error fetching offer letter:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching offer letter",
      error: error.message,
    });
  }
};

// Get offer letter by Offer ID
const getOfferByOfferId = async (req, res) => {
  try {
    const { offerId } = req.params;
    const offer = await Offer.findOne({ offerID: offerId })
      .populate("createdBy", "name email");
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer letter not found",
      });
    }
    
    res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Error fetching offer letter:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching offer letter",
      error: error.message,
    });
  }
};

// Update offer letter
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const offer = await Offer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer letter not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Offer letter updated successfully",
      offer,
    });
  } catch (error) {
    console.error("Error updating offer letter:", error);
    res.status(500).json({
      success: false,
      message: "Error updating offer letter",
      error: error.message,
    });
  }
};

// Delete offer letter
const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer letter not found",
      });
    }
    
    // Delete associated image file if exists
    if (offer.offerImagePath) {
      const filepath = path.join(__dirname, "../uploads", offer.offerImagePath);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
    
    await Offer.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: "Offer letter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting offer letter:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting offer letter",
      error: error.message,
    });
  }
};

// Get offer letters for current user
const getUserOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ createdBy: req.userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Error fetching user offer letters:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user offer letters",
      error: error.message,
    });
  }
};

// Download offer letter image
const downloadOfferImage = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer letter not found",
      });
    }
    
    if (!offer.offerImagePath) {
      return res.status(404).json({
        success: false,
        message: "Offer image not found",
      });
    }
    
    const filepath = path.join(__dirname, "../uploads", offer.offerImagePath);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: "Offer image file not found",
      });
    }
    
    res.download(filepath, `offer_${offer.offerID}.png`, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).json({
          success: false,
          message: "Error downloading offer image",
        });
      }
    });
  } catch (error) {
    console.error("Error downloading offer letter image:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading offer letter image",
      error: error.message,
    });
  }
};

// Update offer status
const updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!["Pending", "Accepted", "Rejected", "Expired"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be Pending, Accepted, Rejected, or Expired",
      });
    }
    
    const offer = await Offer.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer letter not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Offer status updated successfully",
      offer,
    });
  } catch (error) {
    console.error("Error updating offer status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating offer status",
      error: error.message,
    });
  }
};

// Get offer statistics
const getOfferStats = async (req, res) => {
  try {
    const totalOffers = await Offer.countDocuments();
    
    const statusStats = await Offer.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const positionStats = await Offer.aggregate([
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const departmentStats = await Offer.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
    
    const monthlyStats = await Offer.aggregate([
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
        totalOffers,
        positionStats,
      },
    });
  } catch (error) {
    console.error("Error fetching offer statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching offer statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createOffer,
  getAllOffers,
  getOfferById,
  getOfferByOfferId,
  updateOffer,
  deleteOffer,
  getUserOffers,
  downloadOfferImage,
  updateOfferStatus,
  getOfferStats,
};
