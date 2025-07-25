const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel');

router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error });
  }
});

router.post('/batch', async (req, res) => {
  try {
    const { added, changed, deleted } = req.body;
    if (added?.length) await Event.insertMany(added);
    if (changed?.length) {
      for (let event of changed) {
        await Event.findByIdAndUpdate(event._id, event);
      }
    }
    if (deleted?.length) {
      for (let id of deleted) {
        await Event.findByIdAndDelete(id);
      }
    }
    res.json({ message: 'Events updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating events', error });
  }
});

module.exports = router;
