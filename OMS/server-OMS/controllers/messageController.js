// const Message = require('../models/Message');

// // Fetch Messages
// const getMessages = async (req, res) => {
//   try {
//     const { recipient } = req.query;
//     const filter = recipient === 'group' ? { isGroup: true } : { recipient };
//     const messages = await Message.find(filter).sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching messages' });
//   }
// };

// // Send Message
// const sendMessage = async (req, res) => {
//   try {
//     const { sender, recipient, text, isGroup } = req.body;
//     if (!sender || !recipient || !text) {
//       return res.status(400).json({ error: 'Sender, recipient, and text are required' });
//     }
//     const newMessage = new Message({ sender, recipient, text, isGroup });
//     await newMessage.save();
    
//     // Emit real-time event to specific recipient
//     req.io.to(recipient).emit('newMessage', newMessage);

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error('Error sending message:', error);
//     res.status(500).json({ error: 'Error sending message' });
//   }
// };

// module.exports = { getMessages, sendMessage };


const { Message, Chat } = require('../models/chatModel');
const User = require('../models/userModel');
const Candidate = require('../models/Candidate');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Send a message
// @route   POST /api/message
// @access  Protected
// exports.sendMessage = async (req, res) => {
//   const { content, chatId } = req.body;

//   if (!content || !chatId) {
//     return res.status(400).json({ 
//       success: false,
//       message: 'Please provide message content and chat ID' 
//     });
//   }

//   try {
//     // Check if chat exists
//     const chat = await Chat.findById(chatId);
//     if (!chat) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'Chat not found' 
//       });
//     }

//     // Check if user is a participant in the chat
//     const isParticipant = chat.participants.some(
//       participant => participant.toString() === req.user._id.toString()
//     );

//     if (!isParticipant) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Not authorized to send message in this chat' 
//       });
//     }

//     // Create new message
//     const newMessage = {
//       sender: req.user._id,
//       senderModel: 'User', // Assuming the sender is always a User in this case
//       content,
//       chat: chatId
//     };

//     let message = await Message.create(newMessage);

//     message = await message.populate('sender', '-password');
//     message = await message.populate('chat');
//     message = await User.populate(message, {
//       path: 'chat.participants',
//       select: '-password'
//     });

//     // Update latest message in chat
//     await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

//     res.status(201).json({ 
//       success: true,
//       message 
//     });
//   } catch (error) {
//     res.status(500).json({ 
//       success: false,
//       message: 'Error sending message',
//       error: error.message 
//     });
//   }
// };

exports.sendMessage = catchAsync(async (req, res, next) => {
  const { content, chatId } = req.body;
  const attachments = req.files?.map(file => file.path) || [];

  if (!content && attachments.length === 0) {
    return next(new AppError('Message content or attachment is required', 400));
  }

  const chat = await Chat.findById(chatId);
  if (!chat) return next(new AppError('Chat not found', 404));

  // Check if user is participant
  if (!chat.participants.includes(req.user._id)) {
    return next(new AppError('Not authorized for this chat', 403));
  }

  const newMessage = {
    sender: req.user._id,
    senderModel: 'User',
    content: content || '',
    chat: chatId,
    attachments
  };

  let message = await Message.create(newMessage);
  message = await message.populate('sender', 'name email profilePicture');
  message = await message.populate('chat');
  
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

  // Emit socket event
  req.app.get('io').to(chatId).emit('message received', message);

  res.status(201).json({
    status: 'success',
    data: { message }
  });
});

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
// @access  Protected
exports.allMessages = async (req, res) => {
  try {
    // Check if chat exists
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ 
        success: false,
        message: 'Chat not found' 
      });
    }

    // Check if user is a participant in the chat
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view messages in this chat' 
      });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', '-password')
      .populate('chat');

    res.status(200).json({ 
      success: true,
      messages 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching messages',
      error: error.message 
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/message/:messageId/read
// @access  Protected
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }

    // Check if user is a participant in the chat
    const chat = await Chat.findById(message.chat);
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to mark this message as read' 
      });
    }

    // Check if message is already read by this user
    const alreadyRead = message.readBy.some(
      reader => reader.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push(req.user._id);
      await message.save();
    }

    res.status(200).json({ 
      success: true,
      message: 'Message marked as read' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error marking message as read',
      error: error.message 
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/message/:messageId
// @access  Protected
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: 'Message not found' 
      });
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this message' 
      });
    }

    await Message.deleteOne({ _id: message._id });

    res.status(200).json({ 
      success: true,
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting message',
      error: error.message 
    });
  }
};