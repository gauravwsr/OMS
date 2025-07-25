const express = require("express");
const User = require("../models/userModel.js");

const router = express.Router();
const warningLimits = {}; // Store warning counts per user

router.post("/idle-warning", async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: "User ID is required" });

        // Initialize warning count
        if (!warningLimits[userId]) {
            warningLimits[userId] = 1;
        } else {
            warningLimits[userId] += 1;
        }

        console.log(`User ${userId} has been idle. Warning ${warningLimits[userId]}/3`);

        if (warningLimits[userId] >= 3) {
            console.log(`User ${userId} logged out due to inactivity.`);
            delete warningLimits[userId]; // Reset warnings
            return res.status(200).json({ message: "User logged out" });
        }

        res.status(200).json({ message: `Idle warning ${warningLimits[userId]}/3` });
    } catch (error) {
        console.error("Error tracking idle time:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
