const socketio = require("socket.io");
const { Message, Chat } = require("../models/chatModel");

let io;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.email}`);

    // Join user to their own room for private notifications
    socket.on("setup", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} connected`);
      socket.emit("connected");
    });

    // Join chat room
    socket.on("join chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on("newMessage", async (messageData) => {
      try {
        // Emit to all users in the chat except sender
        socket.to(messageData.chat).emit("message received", messageData);
      } catch (error) {
        console.error("Error handling new message:", error);
      }
    });

    // Handle typing events
    socket.on("typing", (chatId) => {
      socket.to(chatId).emit("typing", chatId);
    });

    socket.on("stop typing", (chatId) => {
      socket.to(chatId).emit("stop typing", chatId);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

exports.getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
