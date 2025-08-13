const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: String, required: false },
  cc: { type: String, required: false },
  bcc: { type: String, required: false },
  subject: { type: String, required: false },
  body: { type: String, required: false },
  attachments: [{
    filename: String,
    originalname: String,
    size: Number,
    mimetype: String,
    path: String
  }],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Draft', draftSchema);