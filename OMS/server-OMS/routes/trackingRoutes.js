const express = require("express");
const MouseClick = require("../models/MouseClick");
const ScrollData = require("../models/ScrollData");

const router = express.Router();

// Track mouse movements
router.post("/mouse-movement", async (req, res) => {
    try {
        const { x, y } = req.body;
        res.status(200).json({ message: "Mouse movement recorded" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Track mouse clicks
router.post("/mouse-clicks", async (req, res) => {
    try {
        const { x, y } = req.body;
        const mouseClick = new MouseClick({ x, y });
        await mouseClick.save();
        res.status(200).json({ message: "Mouse click recorded" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Get all mouse clicks
router.get("/mouse-clicks", async (req, res) => {
    try {
        const clicks = await MouseClick.find();
        res.status(200).json(clicks);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Track scroll data
router.post("/scroll-data", async (req, res) => {
    try {
        const { scrollPercentage } = req.body;
        const scrollData = new ScrollData({ scrollPercentage });
        await scrollData.save();
        res.status(200).json({ message: "Scroll data recorded" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// Track user inactivity (Idle detection)
router.post("/idle-warning", async (req, res) => {
    try {
        const { userId } = req.body;
        console.log(`User ${userId} has been idle for more than 5 minutes.`);
        res.status(200).json({ message: "Idle warning sent" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
