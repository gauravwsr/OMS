const { v4: uuidV4 } = require("uuid");
const Meeting = require("../models/Meeting");

exports.createMeeting = async (req, res) => {
  try {
    const { title, hostUserId, expiresAt } = req.body;

    const meetingId = uuidV4();
    const meeting = new Meeting({
      meetingId,
      title: title || "Untitled Meeting",
      hostUserId: hostUserId || null,
      expiresAt: expiresAt || null,
    });

    await meeting.save();

    const joinUrl = `${process.env.FRONTEND_BASE_URL || "http://localhost:5173"}/meeting/${meetingId}`;

    res.status(201).json({ meetingId, joinUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create meeting" });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingId: req.params.meetingId });
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching meeting" });
  }
};
