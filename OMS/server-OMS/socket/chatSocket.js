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
      origin: ["http://localhost:3000", "http://localhost:3001"],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    pingTimeout: 60000,
    transports: ['websocket', 'polling'],
    connectionStateRecovery: {
      // Enables the connection state recovery feature
      maxDisconnectionDuration: 30000, // Maximum duration in ms
      skipMiddlewares: true, // Skip middlewares upon successful recovery
    }
  });

  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Handle ping/pong for connection testing
    socket.on('ping', (data) => {
      console.log(`Ping received from client ${socket.id}:`, data);
      socket.emit('pong', { 
        received: true, 
        serverTime: new Date(), 
        clientData: data 
      });
    });

    // Join user to their own room for private notifications
    socket.on('setup', (userData) => {
      if (!userData || !userData._id) {
        console.error('Invalid user data received:', userData);
        socket.emit('error', { message: 'Invalid user data' });
        return;
      }
      
      try {
        // Save user data on socket for later use
        socket.userId = userData._id;
        socket.email = userData.email || 'unknown';
        socket.name = userData.name || 'unknown';
        
        // Leave any previous rooms to prevent duplicates
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom);
        }
        
        // Join room with user ID
        socket.join(userData._id);
        socket.currentRoom = userData._id;
        
        console.log(`User ${userData.name || 'unknown'} (${userData._id}) connected with socket ${socket.id}`);
        socket.emit('connected', { userId: userData._id, socketId: socket.id });
      } catch (error) {
        console.error('Error in setup handler:', error);
        socket.emit('error', { message: 'Error setting up socket connection' });
      }
    });

    // Handle new messages
    socket.on('newMessage', (message) => {
      try {
        if (!message || !message.chat || !message.chat._id) {
          console.error('Invalid message format:', message);
          socket.emit('error', { message: 'Invalid message format' });
          return;
        }

        const chatId = message.chat._id;
        console.log(`New message in chat ${chatId} from user ${socket.userId || 'unknown'}`);
        
        // Broadcast to all users in the chat room
        socket.to(chatId).emit('messageReceived', message);
        
        // If the message is a direct message, also notify the recipient
        if (message.chat.isGroupChat === false && message.chat.users && message.chat.users.length === 2) {
          // Find the recipient (not the sender)
          const recipient = message.chat.users.find(user => 
            user._id !== (socket.userId || message.sender._id)
          );
          
          if (recipient && recipient._id) {
            console.log(`Sending notification to user ${recipient._id}`);
            socket.to(recipient._id).emit('newMessageNotification', {
              message: message,
              chatId: chatId
            });
          }
        }
      } catch (error) {
        console.error('Error handling new message:', error);
        socket.emit('error', { message: 'Error processing message' });
      }
    });

    // Join chat room
    socket.on('join chat', (chatId) => {
      if (!chatId) {
        console.error('Invalid chatId received');
        socket.emit('error', { message: 'Invalid chat ID' });
        return;
      }
      
      try {
        socket.join(chatId);
        console.log(`User ${socket.userId || 'unknown'} joined chat: ${chatId}`);
        socket.emit('joined chat', chatId);
      } catch (error) {
        console.error(`Error joining chat ${chatId}:`, error);
        socket.emit('error', { message: 'Error joining chat room' });
      }
    });

    // Leave chat room
    socket.on('leave chat', (chatId) => {
      if (chatId) {
        socket.leave(chatId);
        console.log(`User ${socket.userId || 'unknown'} left chat: ${chatId}`);
      }
    });

    // Handle typing events
    socket.on('typing', (chatId) => {
      if (!chatId) return;
      
      socket.to(chatId).emit('typing', { 
        chatId, 
        userId: socket.userId 
      });
    });

    socket.on('stop typing', (chatId) => {
      if (!chatId) return;
      
      socket.to(chatId).emit('stop typing', { 
        chatId, 
        userId: socket.userId 
      });
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected (${socket.userId || 'unknown'}), socket: ${socket.id}, reason: ${reason}`);
      try {
        if (socket.userId) {
          // Update lastLogin to now for User
          const User = require('../models/userModel');
          await User.findByIdAndUpdate(socket.userId, { lastLogin: new Date() });
        }
      } catch (err) {
        console.error('Error updating lastLogin on disconnect:', err);
      }
      // Perform any cleanup needed
    });
  });
};

exports.getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};