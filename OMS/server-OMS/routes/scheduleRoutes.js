const express = require("express");
const { createMeeting, getMeetings } = require("../controllers/scheduleController");

const router = express.Router();

router.post("/", createMeeting);
router.get("/", getMeetings);

module.exports = router;
