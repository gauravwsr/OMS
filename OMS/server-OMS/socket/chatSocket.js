const socketio = require("socket.io");
const { Message, Chat } = require("../models/chatModel");

let io;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: [
        "http://134.199.170.166:3000",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://146.190.165.62:5002",
        "http://localhost:5002",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    pingTimeout: 60000,
    transports: ["websocket", "polling"],
    connectionStateRecovery: {
      // Enables the connection state recovery feature
      maxDisconnectionDuration: 30000, // Maximum duration in ms
      skipMiddlewares: true, // Skip middlewares upon successful recovery
    },
  });

  io.on("connection", (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Handle ping/pong for connection testing
    socket.on("ping", (data) => {
      console.log(`Ping received from client ${socket.id}:`, data);
      socket.emit("pong", {
        received: true,
        serverTime: new Date(),
        clientData: data,
      });
    });

    // Join user to their own room for private notifications
    socket.on("setup", (userData) => {
      if (!userData || !userData._id) {
        console.error("Invalid user data received:", userData);
        socket.emit("error", { message: "Invalid user data" });
        return;
      }

      try {
        // Save user data on socket for later use
        socket.userId = userData._id;
        socket.email = userData.email || "unknown";
        socket.name = userData.name || "unknown";

        // Leave any previous rooms to prevent duplicates
        if (socket.currentRoom) {
          socket.leave(socket.currentRoom);
        }

        // Join room with user ID
        socket.join(userData._id);
        socket.currentRoom = userData._id;

        console.log(
          `User ${userData.name || "unknown"} (${
            userData._id
          }) connected with socket ${socket.id}`
        );
        console.log(`Socket rooms: ${Array.from(socket.rooms)}`);
        socket.emit("connected", { userId: userData._id, socketId: socket.id });
      } catch (error) {
        console.error("Error in setup handler:", error);
        socket.emit("error", { message: "Error setting up socket connection" });
      }
    });

    // Handle user joining their personal room
    socket.on("join", (userId) => {
      if (!userId) {
        console.error("Invalid userId for join event");
        return;
      }

      try {
        socket.join(userId);
        console.log(
          `User ${socket.userId || "unknown"} joined personal room: ${userId}`
        );
      } catch (error) {
        console.error(`Error joining personal room ${userId}:`, error);
      }
    });

    // Handle new messages
    socket.on("new message", async (messageData) => {
      try {
        if (!messageData || !messageData.chat) {
          console.error("Invalid message format:", messageData);
          socket.emit("error", { message: "Invalid message format" });
          return;
        }

        const chatId = messageData.chat;
        console.log(
          `New message in chat ${chatId} from user ${
            socket.userId || "unknown"
          }`
        );

        // Populate the message with chat details for better client handling
        const fullMessage = {
          ...messageData,
          chat: { _id: chatId },
        };

        // Broadcast to all users in the chat room except the sender
        socket.to(chatId).emit("message received", fullMessage);

        console.log(`Message broadcasted to chat room: ${chatId}`);
      } catch (error) {
        console.error("Error handling new message:", error);
        socket.emit("error", { message: "Error processing message" });
      }
    });

    // Join chat room
    socket.on("join chat", (chatId) => {
      if (!chatId) {
        console.error("Invalid chatId received");
        socket.emit("error", { message: "Invalid chat ID" });
        return;
      }
      try {
        socket.join(chatId);
        console.log(
          `User ${socket.userId || "unknown"} joined chat: ${chatId}`
        );
        console.log(
          `Socket rooms after joining chat: ${Array.from(socket.rooms)}`
        );
        socket.emit("joined chat", chatId);
      } catch (error) {
        console.error(`Error joining chat ${chatId}:`, error);
        socket.emit("error", { message: "Error joining chat room" });
      }
    });

    // Leave chat room
    socket.on("leave chat", (chatId) => {
      if (chatId) {
        socket.leave(chatId);
        console.log(`User ${socket.userId || "unknown"} left chat: ${chatId}`);
      }
    });

    // Handle typing events
    socket.on("typing", (data) => {
      if (!data || !data.chatId) return;
      socket.to(data.chatId).emit("typing", {
        chatId: data.chatId,
        userId: data.userId || socket.userId,
      });
    });

    socket.on("stop typing", (data) => {
      if (!data || !data.chatId) return;
      socket.to(data.chatId).emit("stop typing", {
        chatId: data.chatId,
        userId: data.userId || socket.userId,
      });
    });

    // Handle disconnect
    socket.on("disconnect", async (reason) => {
      console.log(
        `User disconnected (${socket.userId || "unknown"}), socket: ${
          socket.id
        }, reason: ${reason}`
      );
      try {
        if (socket.userId) {
          // Update lastLogin to now for User
          const User = require("../models/userModel");
          await User.findByIdAndUpdate(socket.userId, {
            lastLogin: new Date(),
          });
        }
      } catch (err) {
        console.error("Error updating lastLogin on disconnect:", err);
      }

      // Perform any cleanup needed
    });
  });
};

exports.getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
