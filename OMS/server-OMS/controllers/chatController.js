const { Chat, Message } = require('../models/chatModel');
const User = require('../models/userModel');
const Candidate = require('../models/Candidate');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.accessChat = catchAsync(async (req, res, next) => {
  const { userId, candidateId } = req.body;
  
  if (!userId && !candidateId) {
    return next(new AppError('Please provide a user or candidate ID', 400));
  }

  let isCandidate = false;
  let otherParticipant;
  
  if (userId) {
    otherParticipant = await User.findById(userId);
  } else {
    otherParticipant = await Candidate.findById(candidateId);
    isCandidate = true;
  }

  if (!otherParticipant) {
    return next(new AppError('User/Candidate not found', 404));
  }

  // Check for existing chat
  const existingChat = await Chat.findOne({
    isGroupChat: false,
    $and: [
      { participants: req.user._id },
      { participants: otherParticipant._id }
    ],
    participantsModel: isCandidate ? 'Candidate' : 'User'
  })
  .populate('participants', '-password')
  .populate('latestMessage');

  if (existingChat) {
    return res.status(200).json({
      status: 'success',
      data: { chat: existingChat }
    });
  }

  // Create new chat
  const chatData = {
    chatName: "sender",
    isGroupChat: false,
    participants: [req.user._id, otherParticipant._id],
    participantsModel: isCandidate ? 'Candidate' : 'User'
  };

  const createdChat = await Chat.create(chatData);
  const fullChat = await Chat.findById(createdChat._id)
    .populate('participants', '-password');

  res.status(200).json({
    status: 'success',
    data: { chat: fullChat }
  });
});

// @desc    Fetch all chats for a user
// @route   GET /api/chat
// @access  Protected
exports.fetchChats = catchAsync(async (req, res, next) => {
  // Find all chats where the current user is a participant
  const chats = await Chat.find({
    participants: { $elemMatch: { $eq: req.user._id } }
  })
  .populate('participants', '-password')
  .populate('groupAdmin', '-password')
  .populate('latestMessage')
  .sort({ updatedAt: -1 });

  res.status(200).json({ 
    status: 'success',
    data: { chats }
  });
});

// @desc    Create new group chat
// @route   POST /api/chat/group
// @access  Protected
exports.createGroupChat = catchAsync(async (req, res, next) => {
  const { chatName, users, candidates } = req.body;

  if (!chatName || (!users && !candidates)) {
    return next(new AppError('Please provide all required fields', 400));
  }

  // Combine all participants (users and candidates)
  let participants = [req.user._id];
  let participantsModel = 'User'; // Default to User for admin

  if (users && users.length > 0) {
    participants = participants.concat(users);
  }

  if (candidates && candidates.length > 0) {
    participants = participants.concat(candidates);
    participantsModel = 'Candidate'; // If candidates are included
  }

  const groupChat = await Chat.create({
    chatName,
    participants,
    participantsModel,
    isGroupChat: true,
    groupAdmin: req.user._id,
    groupAdminModel: 'User'
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate('participants', '-password')
    .populate('groupAdmin', '-password');

  res.status(201).json({ 
    status: 'success',
    data: { chat: fullGroupChat }
  });
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