// const Project = require("../models/projectmodel");

// // Create a new project
// const createProject = async (req, res) => {
//   try {
//     const { title, description, startDate, dueDate, assignedTo } = req.body;

//     const newProject = new Project({
//       title,
//       description,
//       startDate,
//       dueDate,
//       assignedTo,
//     });

//     await newProject.save();
//     res.status(201).json({ message: "Project created successfully", newProject });
//   } catch (error) {
//     console.error("Error creating project:", error);
//     res.status(500).json({ message: "Error creating project", error });
//   }
// };

// // Get all projects
// const getProjects = async (req, res) => {
//   try {
//     const projects = await Project.find().populate("assignedTo", "name role");
//     res.status(200).json(projects);
//   } catch (error) {
//     console.error("Error fetching projects:", error);
//     res.status(500).json({ message: "Error fetching projects", error });
//   }
// };

// module.exports = { createProject, getProjects };

const { Message, Chat } = require('../models/chatModels');
const User = require('../models/userModel');
const Candidate = require('../models/Candidate');

// @desc    Send a message
// @route   POST /api/message
// @access  Protected
exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({ 
      success: false,
      message: 'Please provide message content and chat ID' 
    });
  }

  try {
    // Check if chat exists
    const chat = await Chat.findById(chatId);
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
        message: 'Not authorized to send message in this chat' 
      });
    }

    // Create new message
    const newMessage = {
      sender: req.user._id,
      senderModel: 'User', // Assuming the sender is always a User in this case
      content,
      chat: chatId
    };

    let message = await Message.create(newMessage);

    message = await message.populate('sender', '-password');
    message = await message.populate('chat');
    message = await User.populate(message, {
      path: 'chat.participants',
      select: '-password'
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json({ 
      success: true,
      message 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error sending message',
      error: error.message 
    });
  }
};

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