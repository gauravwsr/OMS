const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    subject: String,
    startTime: Date,
    endTime: Date,
    Users: [String], // Array of user IDs
    CreateBy: { type: String, required: true } // Ensure it's a single string
});


module.exports = mongoose.model('Event', EventSchema);
