const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/offerController");
const { protect } = require("../middlewares/auth");

// @route   POST /api/offers
// @desc    Create a new offer letter
// @access  Private
router.post("/", protect, createOffer);

// @route   GET /api/offers
// @desc    Get all offer letters
// @access  Private
router.get("/", protect, getAllOffers);

// @route   GET /api/offers/user
// @desc    Get offer letters for current user
// @access  Private
router.get("/user", protect, getUserOffers);

// @route   GET /api/offers/stats
// @desc    Get offer letter statistics
// @access  Private
router.get("/stats", protect, getOfferStats);

// @route   GET /api/offers/offer/:offerId
// @desc    Get offer letter by offer ID
// @access  Private
router.get("/offer/:offerId", protect, getOfferByOfferId);

// @route   GET /api/offers/:id
// @desc    Get offer letter by ID
// @access  Private
router.get("/:id", protect, getOfferById);

// @route   PUT /api/offers/:id
// @desc    Update offer letter
// @access  Private
router.put("/:id", protect, updateOffer);

// @route   PUT /api/offers/:id/status
// @desc    Update offer letter status
// @access  Private
router.put("/:id/status", protect, updateOfferStatus);

// @route   DELETE /api/offers/:id
// @desc    Delete offer letter
// @access  Private
router.delete("/:id", protect, deleteOffer);

// @route   GET /api/offers/:id/download
// @desc    Download offer letter image
// @access  Private
router.get("/:id/download", protect, downloadOfferImage);

module.exports = router;
