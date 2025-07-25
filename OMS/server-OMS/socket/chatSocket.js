// const socketio = require('socket.io');
// const { Chat, Message } = require('../models/chatModel');

// let io;

// exports.init = (server) => {
//   io = socketio(server, {
//     cors: {
//       origin: process.env.CLIENT_URL || 'http://localhost:3000',
//       methods: ['GET', 'POST'],
//       credentials: true
//     }
//   });

//   io.on('connection', (socket) => {
//     console.log('New client connected');

//     // Join a chat room
//     socket.on('join chat', (chatId) => {
//       socket.join(chatId);
//       console.log(`User joined chat: ${chatId}`);
//     });

//     // Handle new message
//     socket.on('new message', async (newMessage) => {
//       try {
//         const message = await Message.create(newMessage);
        
//         // Populate sender and chat
//         await message.populate('sender', '-password');
//         await message.populate('chat');
        
//         // Update latest message in chat
//         await Chat.findByIdAndUpdate(newMessage.chat, { 
//           latestMessage: message 
//         });

//         // Emit to all in the chat room except sender
//         socket.to(newMessage.chat).emit('message received', message);
        
//         // Emit to sender for confirmation
//         socket.emit('message sent', message);
//       } catch (error) {
//         console.error('Error handling new message:', error);
//       }
//     });

//     // Handle typing indicator
//     socket.on('typing', (chatId) => {
//       socket.to(chatId).emit('typing', chatId);
//     });

//     socket.on('stop typing', (chatId) => {
//       socket.to(chatId).emit('stop typing', chatId);
//     });

//     // Handle disconnect
//     socket.on('disconnect', () => {
//       console.log('Client disconnected');
//     });
//   });
// };

// exports.getIO = () => {
//   if (!io) {
//     throw new Error('Socket.io not initialized');
//   }
//   return io;
// };

const socketio = require('socket.io');

let io;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000
  });

  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.email}`);

    // Join user to their own room for private notifications
    socket.on('setup', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} connected`);
      socket.emit('connected');
    });

    // Join chat room
    socket.on('join chat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // Handle typing events
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', chatId);
    });

    socket.on('stop typing', (chatId) => {
      socket.to(chatId).emit('stop typing', chatId);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

exports.getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};