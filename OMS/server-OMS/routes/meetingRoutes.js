const express = require("express");
const { createMeeting, getMeeting } = require("../controllers/meetingController");

const router = express.Router();

router.post("/create", createMeeting);
router.get("/:meetingId", getMeeting);

module.exports = router;
