// const mongoose = require('mongoose');

// // Message Schema
// const messageSchema = new mongoose.Schema({
//   sender: {
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: 'senderModel',
//     required: true
//   },
//   senderModel: {
//     type: String,
//     required: true,
//     enum: ['User', 'Candidate']
//   },
//   content: {
//     type: String,
//     required: true
//   },
//   chat: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Chat',
//     required: true
//   },
//   readBy: [{
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: 'readByModel'
//   }],
//   readByModel: {
//     type: String,
//     enum: ['User', 'Candidate']
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Chat Schema
// const chatSchema = new mongoose.Schema({
//   chatName: {
//     type: String,
//     trim: true
//   },
//   isGroupChat: {
//     type: Boolean,
//     default: false
//   },
//   participants: [{
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: 'participantsModel'
//   }],
//   participantsModel: {
//     type: String,
//     enum: ['User', 'Candidate']
//   },
//   latestMessage: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Message'
//   },
//   groupAdmin: {
//     type: mongoose.Schema.Types.ObjectId,
//     refPath: 'groupAdminModel'
//   },
//   groupAdminModel: {
//     type: String,
//     enum: ['User', 'Candidate']
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Add indexes for better performance
// chatSchema.index({ participants: 1 });
// messageSchema.index({ chat: 1 });

// const Message = mongoose.model('Message', messageSchema);
// const Chat = mongoose.model('Chat', chatSchema);

// module.exports = { Message, Chat };


const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Candidate']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'readByModel'
  }],
  readByModel: {
    type: String,
    enum: ['User', 'Candidate']
  },
  attachments: [{
    type: String // Store file paths
  }]
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  chatName: {
    type: String,
    trim: true
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'participantsModel'
  }],
  participantsModel: {
    type: String,
    enum: ['User', 'Candidate']
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'groupAdminModel'
  },
  groupAdminModel: {
    type: String,
    enum: ['User', 'Candidate']
  }
}, { timestamps: true });

// Indexes
chatSchema.index({ participants: 1 });
messageSchema.index({ chat: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
const Chat = mongoose.model('Chat', chatSchema);

module.exports = { Message, Chat };