const { Message, Chat } = require('../models/chatModel');
const User = require('../models/userModel');
const Candidate = require('../models/Candidate');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


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

  // Un-hide the chat for all other participants (except sender)
  // This ensures that when a user sends a message to someone who has hidden the chat,
  // the recipient will see the chat again
  if (chat.hiddenBy && chat.hiddenBy.length > 0) {
    chat.hiddenBy = chat.hiddenBy.filter(hidden => 
      hidden.user.toString() !== req.user._id.toString()
    );
    await chat.save();
    console.log(`Chat ${chatId} unhidden for other participants after message sent`);
  }

  // Emit socket event to all users in the chat
  const io = req.app.get('io');
  io.to(chatId).emit('message received', message);

  res.status(201).json({
    status: 'success',
    data: { message }
  });
});

// @desc    Get all messages for a chat
// @route   GET /api/message/:chatId
// @access  Protected
exports.allMessages = catchAsync(async (req, res, next) => {
  try {
    // Log the request for debugging
    console.log('Fetching messages for chat ID:', req.params.chatId);
    console.log('Current user:', req.user ? req.user._id : 'undefined');
    
    // Validation check
    if (!req.params.chatId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Chat ID is required'
      });
    }
    
    // Check if user exists
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required'
      });
    }

    // Check if chat exists
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ 
        status: 'fail',
        message: 'Chat not found' 
      });
    }

    // Check if user is a participant in the chat
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        status: 'fail',
        message: 'Not authorized to view messages in this chat' 
      });
    }

    // Fetch messages and filter out those deleted by current user
    const allMessages = await Message.find({ chat: req.params.chatId })
      .populate('sender', '-password')
      .populate('chat')
      .sort({ createdAt: 1 }); // Sort from oldest to newest

    // Filter out messages that have been deleted by the current user
    const messages = allMessages.filter(message => {
      // Check if this message has been deleted by the current user
      const isDeleted = message.deletedBy.some(
        deleted => deleted.user.toString() === req.user._id.toString()
      );
      return !isDeleted; // Return message only if not deleted by current user
    });

    console.log(`Found ${allMessages.length} total messages, ${messages.length} visible to user for chat ${req.params.chatId}`);
    
    // Return filtered messages directly in an array as expected by the client
    res.status(200).json(messages);
    
  } catch (error) {
    console.error('Error in allMessages controller:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching messages',
      error: error.message 
    });
  }
});

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

// @desc    Delete a message (for sender only - marks as deleted for sender)
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

    // Check if already deleted by this user
    const alreadyDeleted = message.deletedBy.some(
      deleted => deleted.user.toString() === req.user._id.toString()
    );

    if (alreadyDeleted) {
      return res.status(400).json({ 
        success: false,
        message: 'Message already deleted' 
      });
    }

    // Add user to deletedBy array instead of deleting the message completely
    await Message.findByIdAndUpdate(
      req.params.messageId,
      {
        $push: {
          deletedBy: {
            user: req.user._id,
            deletedByModel: 'User', // Assuming current user is always User model
            deletedAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Emit socket event to notify about message deletion
    const io = req.app.get('io');
    if (io) {
      io.to(message.chat.toString()).emit('message deleted', {
        messageId: message._id,
        deletedBy: req.user._id,
        chatId: message.chat
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Message deleted for you successfully' 
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting message',
      error: error.message 
    });
  }
};