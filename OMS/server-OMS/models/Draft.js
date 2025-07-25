const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  to: { type: String, required: false },
  subject: { type: String, required: false },
  body: { type: String, required: false },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Draft', draftSchema);