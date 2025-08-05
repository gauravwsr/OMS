const { Chat, Message } = require('../models/chatModel');
const User = require('../models/userModel');
const Candidate = require('../models/Candidate');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.accessChat = catchAsync(async (req, res, next) => {
  try {
    // Debug request body
    console.log('Request body received:', req.body);
    console.log('Current user:', req.user ? req.user._id : 'undefined');
    
    // Get userId from request body with fallback to query params
    const userId = req.body.userId || req.query.userId;
    const candidateId = req.body.candidateId || req.query.candidateId;
    
    // Check if required params exist
    if (!userId && !candidateId) {
      return res.status(400).json({
        status: 'fail',
        message: 'UserId or candidateId parameter is required'
      });
    }
    
    // Check if current user exists on request
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required - current user not found'
      });
    }

    // Check if the target user/candidate exists
    let otherParticipant;
    let isCandidate = false;

    if (userId) {
      // Try to find in Users collection
      otherParticipant = await User.findById(userId);
    } else {
      // Try to find in Candidates collection
      otherParticipant = await Candidate.findById(candidateId);
      if (otherParticipant) {
        isCandidate = true;
      }
    }

    if (!otherParticipant) {
      return res.status(404).json({
        status: 'fail',
        message: 'User or Candidate not found'
      });
    }

    // Check for existing chat
    console.log('Checking for existing chat between:', req.user._id, 'and', otherParticipant._id);
    
    const existingChat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { participants: req.user._id },
        { participants: otherParticipant._id }
      ]
    })
    .populate('participants', '-password')
    .populate('latestMessage');

    if (existingChat) {
      console.log('Found existing chat:', existingChat._id);
      return res.status(200).json({
        status: 'success',
        data: { chat: existingChat }
      });
    }

    // Create new chat
    console.log('Creating new chat');
    
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      participants: [req.user._id, otherParticipant._id],
      participantsModel: isCandidate ? 'Candidate' : 'User'
    };

    const createdChat = await Chat.create(chatData);
    console.log('Chat created with ID:', createdChat._id);
    
    const fullChat = await Chat.findById(createdChat._id)
      .populate('participants', '-password');
    
    console.log('Returning chat data');
    
    return res.status(201).json({
      status: 'success',
      data: { chat: fullChat }
    });
  } catch (error) {
    console.error('Error in accessChat controller:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @desc    Fetch all chats for a user
// @route   GET /api/chat
// @access  Protected
exports.fetchChats = catchAsync(async (req, res, next) => {
  try {
    console.log('Fetching chats for user:', req.user._id);
    
    // Find all chats where the current user is a participant
    const chats = await Chat.find({
      participants: { $elemMatch: { $eq: req.user._id } }
    })
    .populate('participants', '-password')
    .populate('groupAdmin', '-password')
    .populate('latestMessage')
    .sort({ updatedAt: -1 });

    console.log(`Found ${chats.length} chats for user ${req.user._id}`);
    
    // Return in the format expected by the client
    res.status(200).json({ 
      status: 'success',
      data: { chats }
    });
  } catch (err) {
    console.error('Error fetching chats:', err);
    return next(new AppError('Failed to fetch chats: ' + err.message, 500));
  }
});

// @desc    Create new group chat
// @route   POST /api/chat/group
// @access  Protected
exports.createGroupChat = catchAsync(async (req, res, next) => {
  console.log('Creating group chat, request body:', req.body);
  
  const { chatName, users, candidates } = req.body;

  if (!chatName) {
    return next(new AppError('Please provide a group name', 400));
  }
  
  // If only users array is provided (common frontend implementation)
  // We'll treat all IDs as User model references
  const userArray = users || [];
  const candidateArray = candidates || [];
  
  if (userArray.length === 0 && candidateArray.length === 0) {
    return next(new AppError('Please add at least one participant to the group', 400));
  }

  // Always include the creator
  let allParticipants = [req.user._id.toString()]; 
  
  // Add users (avoiding duplicates)
  userArray.forEach(userId => {
    if (userId && !allParticipants.includes(userId.toString())) {
      allParticipants.push(userId.toString());
    }
  });
  
  if (candidateArray.length > 0) {
    candidateArray.forEach(candidateId => {
      if (candidateId && !allParticipants.includes(candidateId.toString())) {
        allParticipants.push(candidateId.toString());
      }
    });
  }
  
  console.log('Final participants list:', allParticipants);

  try {
    // When creating a new group chat, we'll set all participants as User model
    // If we have an actual mix, this would need to be handled differently
    const groupChat = await Chat.create({
      chatName,
      participants: allParticipants,
      participantsModel: 'User',  // Default to User model
      isGroupChat: true,
      groupAdmin: req.user._id,
      groupAdminModel: 'User'
    });
    
    console.log('Created group chat:', groupChat);

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate({
        path: 'participants',
        select: '-password'
      })
      .populate('groupAdmin', '-password');
      
    console.log('Populated group chat:', fullGroupChat);

    // Use the same event emitter for chat notifications
    if (req.app && req.app.get('io')) {
      const io = req.app.get('io');
      allParticipants.forEach(userId => {
        io.to(userId.toString()).emit('newChat', fullGroupChat);
      });
    }

    res.status(201).json({ 
      status: 'success',
      data: { chat: fullGroupChat }
    });
  } catch (error) {
    console.error('Error creating group chat:', error);
    return next(new AppError('Failed to create group chat: ' + error.message, 500));
  }
});

// @desc    Rename group chat
// @route   PUT /api/chat/group/rename
// @access  Protected
exports.renameGroup = catchAsync(async (req, res, next) => {
  const { chatId, chatName } = req.body;

  if (!chatId || !chatName) {
    return next(new AppError('Please provide chat ID and new name', 400));
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true, runValidators: true }
  )
  .populate('participants', '-password')
  .populate('groupAdmin', '-password');

  if (!updatedChat) {
    return next(new AppError('Chat not found', 404));
  }

  res.status(200).json({ 
    status: 'success',
    data: { chat: updatedChat }
  });
});

// @desc    Add user to group
// @route   PUT /api/chat/group/add
// @access  Protected
exports.addToGroup = catchAsync(async (req, res, next) => {
  const { chatId, userId, candidateId } = req.body;

  if (!chatId || (!userId && !candidateId)) {
    return next(new AppError('Please provide chat ID and user/candidate ID', 400));
  }

  // Check if chat exists and is a group chat
  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  if (!chat.isGroupChat) {
    return next(new AppError('This is not a group chat', 400));
  }

  // Check if user is already in the group
  let participantExists = false;
  if (userId) {
    participantExists = chat.participants.some(participant => 
      participant.toString() === userId
    );
  } else if (candidateId) {
    participantExists = chat.participants.some(participant => 
      participant.toString() === candidateId
    );
  }

  if (participantExists) {
    return next(new AppError('User/Candidate already in group', 400));
  }

  // Add user/candidate to group
  if (userId) {
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    chat.participants.push(user._id);
  } else if (candidateId) {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return next(new AppError('Candidate not found', 404));
    }
    chat.participants.push(candidate._id);
    chat.participantsModel = 'Candidate';
  }

  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', '-password')
    .populate('groupAdmin', '-password');

  res.status(200).json({ 
    status: 'success',
    data: { chat: updatedChat }
  });
});

// @desc    Remove user from group
// @route   PUT /api/chat/group/remove
// @access  Protected
exports.removeFromGroup = catchAsync(async (req, res, next) => {
  const { chatId, userId, candidateId } = req.body;

  if (!chatId || (!userId && !candidateId)) {
    return next(new AppError('Please provide chat ID and user/candidate ID', 400));
  }

  // Check if chat exists and is a group chat
  const chat = await Chat.findById(chatId);
  
  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  if (!chat.isGroupChat) {
    return next(new AppError('This is not a group chat', 400));
  }

  // Remove user/candidate from group
  if (userId) {
    chat.participants = chat.participants.filter(
      participant => participant.toString() !== userId
    );
  } else if (candidateId) {
    chat.participants = chat.participants.filter(
      participant => participant.toString() !== candidateId
    );
  }

  await chat.save();

  const updatedChat = await Chat.findById(chatId)
    .populate('participants', '-password')
    .populate('groupAdmin', '-password');

  res.status(200).json({ 
    status: 'success',
    data: { chat: updatedChat }
  });
});

// @desc    Delete a chat
// @route   DELETE /api/chat/:chatId
// @access  Protected
exports.deleteChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.chatId);
  
  if (!chat) {
    return next(new AppError('Chat not found', 404));
  }

  // Check if user is admin or participant
  const isAdmin = chat.isGroupChat && 
    (chat.groupAdmin.toString() === req.user._id.toString());
  
  const isParticipant = chat.participants.some(
    participant => participant.toString() === req.user._id.toString()
  );

  if (!isAdmin && !isParticipant) {
    return next(new AppError('Not authorized to delete this chat', 403));
  }

  // Delete all messages in this chat first
  await Message.deleteMany({ chat: chat._id });

  // Then delete the chat
  await Chat.deleteOne({ _id: chat._id });

  res.status(200).json({ 
    status: 'success',
    message: 'Chat deleted successfully' 
  });
});