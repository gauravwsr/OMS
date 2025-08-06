import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Form,
  Button,
  Badge,
  Modal,
  Tab,
  Nav,
  Spinner,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import { io } from "socket.io-client";
import "./chat.css";
import "./chat-header.css";
import { useAuth } from "../AuthProvider/AuthContext"; // Assuming you have an auth context

const Chat = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeout = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

  // Debug user authentication
  useEffect(() => {
    console.log("Current user:", user);
    console.log("Token:", localStorage.getItem("token"));
    if (!user) {
      setError("User not authenticated. Please log in again.");
    }
  }, [user]);

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      console.log("No user found, skipping socket connection");
      return;
    }

    console.log("Initializing socket connection for user:", user);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      setError("Authentication token missing. Please log in again.");
      return;
    }

    // Validate token structure
    try {
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        throw new Error("Invalid token structure");
      }

      // Check if token payload is valid JSON
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log("Token payload:", { ...payload, userId: payload.userId });

      if (!payload.userId) {
        console.warn("Token missing userId in payload");
      }
    } catch (err) {
      console.error("Invalid token format:", err);
      setError("Invalid authentication token. Please log in again.");
      return;
    }

    const newSocket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
      auth: {
        token: token,
      },
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true, // Force a new connection to avoid sharing
    });

    console.log("Socket instance created, attempting connection");

    newSocket.on("connect", () => {
      console.log("Socket connected successfully with ID:", newSocket.id);
      console.log("Sending setup data for user:", user._id);
      newSocket.emit("setup", user);

      // Emit a test event to verify connection
      newSocket.emit("ping", { userId: user._id, timestamp: new Date() });
    });

    newSocket.on("pong", (data) => {
      console.log("Received pong from server:", data);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      console.error("Connection details:", {
        url: API_BASE_URL,
        transportOptions: newSocket.io.opts,
        auth: { token: token ? "Token exists" : "No token" },
      });
      // Don't set error for the UI immediately - try to reconnect silently first
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);

      if (reason === "io server disconnect") {
        // Server disconnected us, try to reconnect manually
        console.log("Server disconnected socket, attempting reconnection...");
        newSocket.connect();
      }

      // If disconnect reason is related to network issues, socket.io will try to reconnect automatically
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Socket reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed");
      setError("Lost connection to chat server. Please refresh the page.");
    });

    setSocket(newSocket);

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [user, API_BASE_URL]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        console.log("Fetching data from:", API_BASE_URL);

        // Fetch users with proper error handling
        try {
          const usersRes = await axios.get(`${API_BASE_URL}/users`, {
            headers,
          });
          console.log("Users response:", usersRes.data);

          if (usersRes.data && Array.isArray(usersRes.data)) {
            setUsers(usersRes.data.filter((u) => u.role !== "Super_Admin"));
          } else {
            console.warn("Unexpected users data format:", usersRes.data);
            setUsers([]);
          }
        } catch (userError) {
          console.error("Error fetching users:", userError);
          setUsers([]);
        }

        // Fetch candidates with proper error handling
        try {
          const candidatesRes = await axios.get(
            `${API_BASE_URL}/api/candidates`,
            { headers }
          );
          console.log("Candidates response:", candidatesRes.data);

          if (
            candidatesRes.data?.data &&
            Array.isArray(candidatesRes.data.data)
          ) {
            setCandidates(candidatesRes.data.data);
          } else if (Array.isArray(candidatesRes.data)) {
            setCandidates(candidatesRes.data);
          } else {
            console.warn(
              "Unexpected candidates data format:",
              candidatesRes.data
            );
            setCandidates([]);
          }
        } catch (candidateError) {
          console.error("Error fetching candidates:", candidateError);
          setCandidates([]);
        }

        // Fetch chats with proper error handling
        try {
          console.log("Fetching chats from:", `${API_BASE_URL}/api/chat`);
          console.log("Using headers:", headers);

          // Create an axios instance with CORS settings
          const axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            withCredentials: true,
            timeout: 15000,
            headers: headers,
          });

          const chatsRes = await axiosInstance.get("/api/chat");

          console.log("Chats response:", chatsRes.data);

          // Handle different possible response formats
          if (Array.isArray(chatsRes.data)) {
            setChats(chatsRes.data);
          } else if (
            chatsRes.data?.data?.chats &&
            Array.isArray(chatsRes.data.data.chats)
          ) {
            setChats(chatsRes.data.data.chats);
          } else if (
            chatsRes.data?.chats &&
            Array.isArray(chatsRes.data.chats)
          ) {
            setChats(chatsRes.data.chats);
          } else {
            console.warn("Unexpected chats data format:", chatsRes.data);
            setChats([]);
          }
        } catch (chatError) {
          console.error("Error fetching chats:", chatError);

          if (chatError.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error status:", chatError.response.status);
            console.error("Error data:", chatError.response.data);
            console.error("Error headers:", chatError.response.headers);

            if (chatError.response.status === 401) {
              setError("Authentication failed. Please log in again.");
            } else {
              setError(
                `Server error: ${chatError.response.status}. Please try again later.`
              );
            }
          } else if (chatError.request) {
            // The request was made but no response was received
            console.error("No response received:", chatError.request);
            setError("Network error: Could not connect to chat server");
          } else {
            // Something happened in setting up the request
            console.error("Request error:", chatError.message);
            setError("Failed to load chat data. Please check your connection.");
          }

          setChats([]);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load initial data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    console.log("Setting up socket event listeners for user:", user._id);

    // Listen for connection and setup events
    const handleConnect = () => {
      console.log("Socket connected in listener, joining user room:", user._id);
      socket.emit("setup", user);
    };

    const handleConnected = (data) => {
      console.log(
        "Server acknowledged user setup, socket fully connected:",
        data
      );

      // If we're already in a chat, join that room
      if (selectedChat) {
        console.log("Joining previously selected chat:", selectedChat._id);
        socket.emit("join chat", selectedChat._id);
      }
    };

    // Handle incoming messages
    const handleMessageReceived = (newMessage) => {
      console.log("New message received from socket:", newMessage);

      if (!newMessage || !newMessage._id) {
        console.warn("Received invalid message format:", newMessage);
        return;
      }

      if (
        selectedChat &&
        newMessage.chat &&
        selectedChat._id === newMessage.chat._id
      ) {
        // Add message to current chat
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;
          // Replace temp message if needed
          const tempIndex = prev.findIndex(
            (msg) =>
              msg.isTemp &&
              msg.content === newMessage.content &&
              msg.sender._id === newMessage.sender._id
          );
          if (tempIndex >= 0) {
            const newMessages = [...prev];
            newMessages[tempIndex] = newMessage;
            return newMessages;
          }
          return [...prev, newMessage];
        });
        // Update chat list: latestMessage and clear unreadCount
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === newMessage.chat._id
              ? { ...chat, latestMessage: newMessage, unreadCount: 0, notification: false }
              : chat
          )
        );
      } else {
        // Message is for a different chat, update chat list and show notification
        setChats((prev) =>
          prev.map((chat) =>
            chat._id === newMessage.chat._id
              ? {
                  ...chat,
                  latestMessage: newMessage,
                  unreadCount: (chat.unreadCount || 0) + 1,
                  notification: true,
                }
              : chat
          )
        );
        // Browser notification (if permissions granted)
        try {
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(
              newMessage.chat.isGroupChat
                ? newMessage.chat.chatName
                : newMessage.sender?.name || "New Message",
              {
                body: newMessage.content,
                icon: "/favicon.ico",
              }
            );
          } else if (
            "Notification" in window &&
            Notification.permission !== "denied"
          ) {
            Notification.requestPermission();
          }
          // Optionally play a sound here
          // const audio = new Audio('/notification.mp3');
          // audio.play();
        } catch (e) {
          console.warn("Failed to create notification:", e);
        }
      }
    };

    // Handle new chat creation
    const handleChatCreated = (newChat) => {
      console.log("New chat created:", newChat);
      setChats((prev) => {
        // Check if chat already exists
        if (prev.some((chat) => chat._id === newChat._id)) {
          return prev;
        }
        return [newChat, ...prev]; // Add to beginning of list
      });
    };

    // Handle typing indicators
    const handleTyping = (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        // Set typing indicator for this chat
        console.log("User is typing in current chat:", data);

        // Don't show typing indicator for current user
        if (data.userId === user._id) return;

        setIsTyping(true);

        // Track who is typing for group chats
        if (selectedChat.isGroupChat) {
          setTypingUsers((prev) => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
        }
      }
    };

    const handleStopTyping = (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        // Clear typing indicator
        console.log("User stopped typing in current chat:", data);

        if (data.userId === user._id) return;

        // For group chats, remove this user from typing users
        if (selectedChat.isGroupChat) {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));

          // If no one is typing anymore, hide the indicator
          if (typingUsers.length <= 1 && typingUsers[0] === data.userId) {
            setIsTyping(false);
          }
        } else {
          // For 1:1 chats, just hide the indicator
          setIsTyping(false);
        }
      }
    };

    // Handle errors from socket
    const handleError = (error) => {
      console.error("Socket error:", error);
      if (error.reconnect) {
        // This is a reconnectable error
        setError(
          `Chat connection issue: ${error.message}. Trying to reconnect...`
        );
      }
    };

    // Register all event listeners
    socket.on("connect", handleConnect);
    socket.on("connected", handleConnected);
    socket.on("message received", handleMessageReceived);
    socket.on("chatCreated", handleChatCreated);
    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);
    socket.on("error", handleError);

    // Check if already connected and send setup if needed
    if (socket.connected) {
      console.log("Socket already connected on listener setup, sending setup");
      socket.emit("setup", user);
    }

    return () => {
      console.log("Cleaning up socket event listeners");
      socket.off("connect", handleConnect);
      socket.off("connected", handleConnected);
      socket.off("message received", handleMessageReceived);
      socket.off("chatCreated", handleChatCreated);
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      socket.off("error", handleError);
    };
  }, [socket, user, selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        console.log("Fetching messages for chat:", selectedChat._id);
        console.log(
          "Using API URL:",
          `${API_BASE_URL}/api/message/${selectedChat._id}`
        );

        const response = await axios.get(
          `${API_BASE_URL}/api/message/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
            timeout: 10000, // 10 second timeout
          }
        );

        console.log("Messages fetched:", response.data);

        // Handle different possible response formats
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setMessages(response.data.data);
        } else {
          console.warn("Unexpected messages data format:", response.data);
          setMessages([]);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        if (err.response) {
          console.error("Error status:", err.response.status);
          console.error("Error data:", err.response.data);
        } else if (err.request) {
          // The request was made but no response was received
          console.error("No response received:", err.request);
          setError("Network error: Could not connect to chat server");
        } else {
          // Something happened in setting up the request
          console.error("Request error:", err.message);
        }
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat, API_BASE_URL]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) {
      console.log("Cannot send message: missing message or chat");
      return;
    }

    // Create a unique ID for this message attempt
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

    // Clear the input field immediately for better UX
    const messageContent = newMessage.trim();
    setNewMessage("");

    // Track if we've had a network error
    let networkError = false;

    // Create a temporary message to show immediately in the UI
    const tempMessage = {
      _id: tempId,
      sender: user,
      content: messageContent,
      chat: selectedChat,
      createdAt: new Date(),
      isTemp: true, // Flag to identify this as a temporary message
      sending: true, // Indicates the message is in the process of sending
    };

    // Add temp message to UI immediately
    setMessages((prev) => [...prev, tempMessage]);

    // Start typing indicator cleanup
    if (socket && socket.connected) {
      socket.emit("stop typing", selectedChat._id);
    }

    try {
      console.log(
        "Sending message:",
        messageContent,
        "to chat:",
        selectedChat._id
      );

      // Send the actual message to the server
      const token = localStorage.getItem("token");

      // Set a timeout to detect slow network conditions
      const slowNetworkTimeout = setTimeout(() => {
        // Mark message as "sending..." if it takes more than 2 seconds
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempId ? { ...msg, slowNetwork: true } : msg
          )
        );
      }, 2000);

      const response = await axios.post(
        `${API_BASE_URL}/api/message`,
        {
          content: messageContent,
          chatId: selectedChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout for slow connections
        }
      );

      // Clear the slow network timeout
      clearTimeout(slowNetworkTimeout);

      console.log("Message sent successfully:", response.data);

      // The server returns data in a different format: { status: 'success', data: { message: {...} } }
      // Extract the actual message object from the response
      const messageData = response.data.data?.message;

      if (!messageData || !messageData._id) {
        console.error("Unexpected response structure:", response.data);
        throw new Error("Invalid response from server");
      }

      // Replace temporary message with real one
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId ? { ...messageData, wasTemp: true } : msg
        )
      );

      // Update the chat with the latest message
      setChats((prev) =>
        prev.map((chat) =>
          chat._id === selectedChat._id
            ? { ...chat, latestMessage: messageData }
            : chat
        )
      );

      // Emit to socket for other users to receive the message
      if (socket && socket.connected) {
        console.log("Emitting new message via socket:", messageData._id);
        // Match the event name expected on the server
        socket.emit("new message", messageData);
      } else {
        console.warn(
          "Socket disconnected, message sent but real-time updates unavailable"
        );
        // If socket is disconnected, we still sent the message via HTTP
        // When socket reconnects, the next message will trigger a refresh
      }
    } catch (err) {
      networkError = true;
      console.error("Error sending message:", err);

      const errorMsg =
        err.response?.data?.message || err.message || "Failed to send message";
      console.log("Error details:", errorMsg);

      // Only show error UI for a moment
      setError(errorMsg);
      setTimeout(() => setError(null), 3000);

      // Update the temporary message to show error state
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempId
            ? { ...msg, sendFailed: true, sending: false, error: errorMsg }
            : msg
        )
      );

      // Provide retry functionality
      const retryMsg = messageContent;

      // Add a retry button to the message
      // This implementation depends on your UI, but you can add a retry button next to failed messages
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log("Adding friend:", userId);

      // Debug token before sending request
      const tokenPayload = token ? JSON.parse(atob(token.split(".")[1])) : null;
      console.log("Token payload:", tokenPayload);

      // Log what we're about to send
      console.log("Sending chat request with data:", { userId });

      // Create request data object explicitly to ensure correct format
      const requestData = {
        userId: userId, // Make sure userId is a string
      };

      console.log("Request payload:", JSON.stringify(requestData));

      const response = await axios({
        method: "POST",
        url: `${API_BASE_URL}/api/chat`,
        data: requestData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
        timeout: 15000,
      });

      console.log("Friend added successfully:", response.data);

      // Extract chat data from response based on API structure
      let chatData;
      if (response.data.data && response.data.data.chat) {
        chatData = response.data.data.chat;
      } else if (response.data.chat) {
        chatData = response.data.chat;
      } else {
        chatData = response.data;
      }

      console.log("Extracted chat data:", chatData);
      setSelectedChat(chatData);

      // Check if chat already exists in list
      if (!chats.some((chat) => chat._id === chatData._id)) {
        setChats((prev) => [...prev, chatData]);
      }

      setShowAddFriendModal(false);
      setError(null);
    } catch (err) {
      console.error("Error adding friend:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to create chat";
      setError(`Chat Error: ${errorMessage}`);

      // Log detailed error information
      if (err.response) {
        console.error("Error response:", err.response.data);
        console.error("Status code:", err.response.status);
        console.error("Request data sent:", { userId });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      console.log(
        "Creating group with name:",
        groupName,
        "and users:",
        selectedUsers
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/chat/group`,
        {
          chatName: groupName,
          users: selectedUsers,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 15000,
        }
      );

      console.log("Group created successfully:", response.data);

      // Extract chat data from response based on API structure
      let chatData;
      if (response.data.data && response.data.data.chat) {
        chatData = response.data.data.chat;
      } else if (response.data.chat) {
        chatData = response.data.chat;
      } else {
        chatData = response.data;
      }

      console.log("Extracted group chat data:", chatData);
      setSelectedChat(chatData);

      // Check if chat already exists in list
      if (!chats.some((chat) => chat._id === chatData._id)) {
        setChats((prev) => [...prev, chatData]);
      }

      setShowNewGroupModal(false);
      setGroupName("");
      setSelectedUsers([]);
      setError(null);
    } catch (err) {
      console.error("Error creating group:", err);

      // Detailed error logging
      if (err.response) {
        console.error("Error status:", err.response.status);
        console.error("Error response:", err.response.data);
        console.error("Request data sent:", {
          chatName: groupName,
          users: selectedUsers,
        });
      } else if (err.request) {
        console.error("No response received:", err.request);
      } else {
        console.error("Request error:", err.message);
      }

      setError(
        err.response?.data?.message || err.message || "Failed to create group"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRenameGroup = async (newName) => {
    if (!selectedChat || !newName.trim()) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/chat/group/rename`,
        {
          chatId: selectedChat._id,
          chatName: newName,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const chatData = res.data?.data?.chat || res.data?.chat || res.data;
      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? chatData : chat))
      );
      setSelectedChat(chatData);
    } catch (err) {
      setError("Failed to rename group");
    }
  };

  const handleAddToGroup = async (userId) => {
    if (!selectedChat || !userId) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/chat/group/add`,
        {
          chatId: selectedChat._id,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const chatData = res.data?.data?.chat || res.data?.chat || res.data;
      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? chatData : chat))
      );
      setSelectedChat(chatData);
    } catch (err) {
      setError("Failed to add user to group");
    }
  };

  const handleRemoveFromGroup = async (userId) => {
    if (!selectedChat || !userId) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/chat/group/remove`,
        {
          chatId: selectedChat._id,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Extract chat object from response
      const chatData = res.data?.data?.chat || res.data?.chat || res.data;

      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? chatData : chat))
      );

      // Check if current user is still a participant
      const isStillParticipant = Array.isArray(chatData?.participants)
        ? chatData.participants.some((p) => p && p._id === user._id)
        : false;

      if (isStillParticipant) {
        setSelectedChat(chatData);
      } else {
        setSelectedChat(null);
        setShowGroupInfoModal(false);
      }
    } catch (err) {
      setError("Failed to remove user from group");
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/chat/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setChats((prev) => prev.filter((chat) => chat._id !== selectedChat._id));
      setSelectedChat(null);
    } catch (err) {
      setError("Failed to delete chat");
    }
  };

  const toggleUserSelection = (userId) => {
    if (!userId) {
      console.warn("Attempted to toggle selection for undefined userId");
      return;
    }

    console.log("Toggling user selection for:", userId);
    setSelectedUsers((prev) => {
      // Ensure prev is always an array
      const currentUsers = Array.isArray(prev) ? prev : [];

      return currentUsers.includes(userId)
        ? currentUsers.filter((id) => id !== userId)
        : [...currentUsers, userId];
    });
  };

  const getAvatarText = (name) => {
    if (!name || typeof name !== "string") return "??";
    try {
      const initials = name
        .split(" ")
        .map((n) => n[0] || "")
        .join("")
        .toUpperCase();
      return initials.substring(0, 2) || "??";
    } catch (error) {
      console.error("Error generating avatar text:", error);
      return "??";
    }
  };

  const getStatusText = (person) => {
    if (!person || typeof person !== "object") return "offline";
    if (!person.lastLogin) return "offline";

    try {
      const lastLogin = new Date(person.lastLogin);
      const diff = (new Date() - lastLogin) / (1000 * 60 * 60); // hours

      if (diff < 0.5) return "online";
      if (diff < 24) return `last seen ${Math.floor(diff)}h ago`;
      return "offline";
    } catch {
      return "offline";
    }
  };

  // Final cleanup effect for the component
  useEffect(() => {
    return () => {
      // Clear any typing timeouts
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }

      // Stop any active typing indicators
      if (socket && socket.connected && selectedChat) {
        socket.emit("stop typing", selectedChat._id);
      }
    };
  }, [socket, selectedChat]);

  const getAvailableUsers = () => {
    if (!user || !user._id) {
      console.warn("User not available for filtering");
      return [...(users || []), ...(candidates || [])].filter(
        (u) => u && u._id
      );
    }
    return [...(users || []), ...(candidates || [])].filter(
      (u) => u && u._id && u._id !== user._id
    );
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <div className="mt-3">Loading chat...</div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Chat Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button
              variant="outline-danger"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Alert variant="warning">
          <Alert.Heading>Authentication Required</Alert.Heading>
          <p>Please log in to access the chat feature.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="chat-container">
      <Row className="h-100">
        {/* Left sidebar - Chats list */}
        <Col md={4} className="p-0 border-end">
          <div className="sidebar-header p-3 border-bottom d-flex justify-content-between align-items-center">
            <h5>Office Chat</h5>
            <div className="btn-cont">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddFriendModal(true)}
                className="me-2"
              >
                Add Friend
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowNewGroupModal(true)}
              >
                New Group
              </Button>
            </div>
          </div>

          <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
            <Nav variant="tabs" className="px-3 pt-2">
              <Nav.Item>
                <Nav.Link eventKey="personal">Chats</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="groups">Groups</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content className="p-2">
              <Tab.Pane eventKey="personal">
                <Form.Control
                  type="text"
                  placeholder="Search chats..."
                  className="mb-3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <ListGroup variant="flush">
                  {chats
                    .filter((chat) => !chat.isGroupChat)
                    .filter(
                      (chat) =>
                        chat.chatName
                          ?.toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        chat.participants?.some((p) =>
                          p.name
                            ?.toLowerCase()
                            .includes(searchTerm.toLowerCase())
                        )
                    )
                    .map((chat) => (
                      <ListGroup.Item
                        key={chat._id}
                        action
                        active={selectedChat?._id === chat._id}
                        onClick={() => {
                          setSelectedChat(chat);
                          // Clear unread count and notification for this chat
                          setChats((prev) =>
                            prev.map((c) =>
                              c._id === chat._id
                                ? { ...c, unreadCount: 0, notification: false }
                                : c
                            )
                          );
                        }}
                        className="d-flex align-items-center"
                      >
                        <div
                          className="avatar me-3"
                          style={{ position: "relative" }}
                        >
                          {getAvatarText(
                            chat.participants &&
                              Array.isArray(chat.participants)
                              ? chat.participants.find(
                                  (p) =>
                                    p &&
                                    p._id &&
                                    user &&
                                    user._id &&
                                    p._id !== user._id
                                )?.name || "?"
                              : "?"
                          )}
                          {(chat.unreadCount > 0 || chat.notification) && (
                            <span
                              style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-4px",
                                background: "#dc3545",
                                color: "white",
                                borderRadius: "50%",
                                fontSize: "0.7rem",
                                minWidth: chat.unreadCount > 0 ? "18px" : "10px",
                                height: chat.unreadCount > 0 ? "18px" : "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: chat.unreadCount > 0 ? "0 4px" : 0,
                                zIndex: 2,
                              }}
                            >
                              {chat.unreadCount > 0 ? (chat.unreadCount > 9 ? "9+" : chat.unreadCount) : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong>
                              {chat.participants &&
                              Array.isArray(chat.participants) &&
                              user &&
                              user._id
                                ? chat.participants.find(
                                    (p) => p && p._id && p._id !== user._id
                                  )?.name || "Chat"
                                : "Chat"}
                            </strong>
                            <small className="text-muted">
                              {chat.latestMessage?.createdAt
                                ? new Date(
                                    chat.latestMessage.createdAt
                                  ).toLocaleTimeString()
                                : ""}
                            </small>
                          </div>
                          <small className="text-muted">
                            {chat.latestMessage?.content || "No messages yet"}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Tab.Pane>

              <Tab.Pane eventKey="groups">
                <ListGroup variant="flush">
                  {chats
                    .filter((chat) => chat.isGroupChat)
                    .filter((chat) =>
                      chat.chatName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((chat) => (
                      <ListGroup.Item
                        key={chat._id}
                        action
                        active={selectedChat?._id === chat._id}
                        onClick={() => {
                          setSelectedChat(chat);
                          setChats((prev) =>
                            prev.map((c) =>
                              c._id === chat._id
                                ? { ...c, unreadCount: 0, notification: false }
                                : c
                            )
                          );
                        }}
                        className="d-flex align-items-center"
                      >
                        <div className="avatar me-3 group-avatar" style={{ position: "relative" }}>
                          {getAvatarText(chat.chatName)}
                          {(chat.unreadCount > 0 || chat.notification) && (
                            <span
                              style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-4px",
                                background: "#dc3545",
                                color: "white",
                                borderRadius: "50%",
                                fontSize: "0.7rem",
                                minWidth: chat.unreadCount > 0 ? "18px" : "10px",
                                height: chat.unreadCount > 0 ? "18px" : "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: chat.unreadCount > 0 ? "0 4px" : 0,
                                zIndex: 2,
                              }}
                            >
                              {chat.unreadCount > 0 ? (chat.unreadCount > 9 ? "9+" : chat.unreadCount) : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong>{chat.chatName}</strong>
                            <small className="text-muted">
                              {chat.participants?.length || 0} members
                            </small>
                          </div>
                          <small className="text-muted">
                            {chat.latestMessage?.content || "No messages yet"}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>

        {/* Right side - Chat area */}
        <Col md={8} className="chat-area p-0 d-flex flex-column">
          {selectedChat ? (
            <>
              <div className="chat-header">
                <div className="chat-header-avatar">
                  {getAvatarText(
                    selectedChat.isGroupChat
                      ? selectedChat.chatName
                      : selectedChat.participants &&
                        Array.isArray(selectedChat.participants) &&
                        user &&
                        user._id
                      ? selectedChat.participants.find(
                          (p) => p && p._id && p._id !== user._id
                        )?.name
                      : "?"
                  )}
                </div>
                <div className="chat-header-info">
                  <div className="chat-header-name">
                    {selectedChat.isGroupChat
                      ? selectedChat.chatName
                      : selectedChat.participants &&
                        Array.isArray(selectedChat.participants) &&
                        user &&
                        user._id
                      ? selectedChat.participants.find(
                          (p) => p && p._id && p._id !== user._id
                        )?.name || "Chat"
                      : "Chat"}
                  </div>
                  <div
                    className={`chat-header-status ${
                      !selectedChat.isGroupChat && "online"
                    }`}
                  >
                    {selectedChat.isGroupChat
                      ? `${
                          selectedChat.participants &&
                          Array.isArray(selectedChat.participants)
                            ? selectedChat.participants.length
                            : 0
                        } members`
                      : getStatusText(
                          selectedChat.participants &&
                            Array.isArray(selectedChat.participants) &&
                            user &&
                            user._id
                            ? selectedChat.participants.find(
                                (p) => p && p._id && p._id !== user._id
                              )
                            : null
                        )}
                  </div>
                </div>
                <div className="chat-header-actions">
                  {selectedChat.isGroupChat && (
                    <>
                      <button
                        className="chat-header-button"
                        title="Group Info"
                        onClick={() => setShowGroupInfoModal(true)}
                      >
                        <i className="fas fa-info-circle"></i>
                      </button>
                      <button
                        className="chat-header-button"
                        title="Leave Group"
                        onClick={() => handleRemoveFromGroup(user._id)}
                      >
                        <i className="fas fa-sign-out-alt"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="messages-container flex-grow-1 p-3">
                {messages.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    // Add safety checks to prevent accessing properties of undefined objects
                    if (!message || !message._id) {
                      return null; // Skip rendering invalid messages
                    }

                    const isSender =
                      message.sender &&
                      message.sender._id &&
                      user &&
                      user._id &&
                      message.sender._id === user._id;

                    const isTemp = message.isTemp;
                    const sendFailed = message.sendFailed;
                    const isSending = message.sending && !sendFailed;
                    const slowNetwork = message.slowNetwork;

                    return (
                      <div
                        key={message._id}
                        className={`message mb-3 ${
                          isSender ? "sent" : "received"
                        } ${isTemp ? "temp" : ""} ${
                          sendFailed ? "send-failed" : ""
                        }`}
                      >
                        <div className="message-content">
                          {/* Show sender name in group chats for received messages */}
                          {selectedChat.isGroupChat &&
                            !isSender &&
                            message.sender && (
                              <div className="message-sender-name text-muted small mb-1">
                                {message.sender.name || "Unknown User"}
                              </div>
                            )}
                          <div className="message-text">
                            {message.content || ""}
                          </div>
                          <div className="message-time">
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : ""}
                          </div>
                          {isSender && (
                            <div
                              className={`message-status ${
                                isSending ? "sending" : ""
                              } ${sendFailed ? "error" : ""} ${
                                !isTemp && !sendFailed ? "delivered" : ""
                              }`}
                            >
                              {sendFailed && (
                                <span>
                                  Failed to send
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-0 ms-1"
                                    onClick={() => {
                                      // Set the message back to input field to retry
                                      setNewMessage(message.content);
                                      // Remove the failed message
                                      setMessages((prev) =>
                                        prev.filter(
                                          (m) => m._id !== message._id
                                        )
                                      );
                                    }}
                                  >
                                    Retry
                                  </Button>
                                </span>
                              )}
                              {isSending && (
                                <span>{slowNetwork ? "Sending..." : "●"}</span>
                              )}
                              {!isTemp && !sendFailed && !message.wasTemp && (
                                <span>✓</span>
                              )}
                              {message.wasTemp && <span>✓✓</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {isTyping && (
                <div className="typing-indicator px-3 py-2">
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="typing-text">
                    {selectedChat.isGroupChat && typingUsers.length > 0
                      ? `${typingUsers.length} ${
                          typingUsers.length === 1 ? "person" : "people"
                        } typing...`
                      : "Typing..."}
                  </span>
                </div>
              )}

              <div className="message-input">
                <Form.Group className="d-flex position-relative">
                  <Form.Control
                    as="textarea"
                    rows={1}
                    placeholder={`Message : ${
                      selectedChat.isGroupChat
                        ? selectedChat.chatName || "Group"
                        : selectedChat.participants &&
                          Array.isArray(selectedChat.participants) &&
                          user &&
                          user._id
                        ? selectedChat.participants.find(
                            (p) => p && p._id && p._id !== user._id
                          )?.name || "Chat"
                        : "Chat"
                    }`}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);

                      // Handle typing indicators
                      if (socket && socket.connected && selectedChat) {
                        // Use a debounced typing indicator to avoid spamming
                        if (!typingTimeout.current) {
                          socket.emit("typing", selectedChat._id);

                          // Set a timeout to stop typing indicator after 3 seconds of inactivity
                          typingTimeout.current = setTimeout(() => {
                            socket.emit("stop typing", selectedChat._id);
                            typingTimeout.current = null;
                          }, 3000);
                        } else {
                          // Clear and reset typing timeout
                          clearTimeout(typingTimeout.current);
                          typingTimeout.current = setTimeout(() => {
                            socket.emit("stop typing", selectedChat._id);
                            typingTimeout.current = null;
                          }, 3000);
                        }
                      }
                    }}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSendMessage()
                    }
                  />
                  <Button
                    variant="link"
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                  >
                    {loading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <i className="fas fa-paper-plane"></i>
                    )}
                  </Button>
                </Form.Group>
              </div>
            </>
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100">
              <div className="text-center p-5 ">
                <h4>Welcome to Office Chat</h4>
                <p className="text-muted">
                  {chats.length === 0
                    ? "Start by adding a friend or creating a group"
                    : "Select a conversation to start chatting"}
                </p>
                <div className="flex gap-6">
                  <Button
                    variant="primary"
                    onClick={() => setShowAddFriendModal(true)}
                    className="me-2"
                  >
                    Add Friend
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowNewGroupModal(true)}
                    className="me-2"
                  >
                    Create Group
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Col>
      </Row>

      {/* Add Friend Modal */}
      <Modal
        show={showAddFriendModal}
        onHide={() => setShowAddFriendModal(false)}
      >
        <Modal.Header
          closeButton
          className="bg-light border-bottom border-2 sticky-top"
        >
          <Modal.Title className="fw-bold text-primary">
            Add New Connection
          </Modal.Title>
        </Modal.Header>
        <div className="sticky-top bg-white px-3 pt-3 border-bottom pb-3">
          <Form.Control
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Modal.Body
          className="pt-2"
          style={{ maxHeight: "60vh", overflowY: "auto" }}
        >
          <ListGroup variant="flush">
            {getAvailableUsers()
              .filter(
                (person) =>
                  person.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  person.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((person) => (
                <ListGroup.Item
                  key={person._id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <div
                      className={`avatar me-3 ${
                        getStatusText(person) === "online" ? "online" : ""
                      }`}
                    >
                      {getAvatarText(person.name)}
                    </div>
                    <div>
                      <strong>{person.name}</strong>
                      <div className="text-muted small">
                        {person.email || person.personalMail}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleAddFriend(person._id)}
                    disabled={chats.some(
                      (chat) =>
                        !chat.isGroupChat &&
                        chat.participants?.some((p) => p._id === person._id)
                    )}
                  >
                    {chats.some(
                      (chat) =>
                        !chat.isGroupChat &&
                        chat.participants?.some((p) => p._id === person._id)
                    )
                      ? "Already connected"
                      : "Add"}
                  </Button>
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Modal.Body>
      </Modal>

      {/* New Group Modal */}
      <Modal
        show={showNewGroupModal}
        onHide={() => setShowNewGroupModal(false)}
      >
        <Modal.Header closeButton className="bg-light border-bottom border-2">
          <Modal.Title className="fw-bold text-primary">
            Create New Group
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Group Name*</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className={!groupName.trim() ? "is-invalid" : ""}
            />
            {!groupName.trim() && (
              <Form.Text className="text-danger">
                Group name is required
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group>
            <Form.Label>Add Members*</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search users..."
              className="mb-3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {selectedUsers.length === 0 && (
              <div className="text-danger mb-2">
                Please select at least one member
              </div>
            )}

            {selectedUsers.length > 0 && (
              <div className="mb-3">
                <strong>Selected ({selectedUsers.length}):</strong>
                <div className="d-flex flex-wrap gap-1 mt-1">
                  {selectedUsers
                    .filter((userId) => userId)
                    .map((userId) => {
                      const availableUsers = getAvailableUsers() || [];
                      const person = availableUsers.find(
                        (u) => u && u._id === userId
                      );
                      return person ? (
                        <span
                          key={userId}
                          className="badge bg-primary d-flex align-items-center"
                        >
                          {person.name || "Unknown"}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: "0.5rem" }}
                            onClick={() => toggleUserSelection(userId)}
                            aria-label="Remove"
                          ></button>
                        </span>
                      ) : null;
                    })}
                </div>
              </div>
            )}

            <div
              style={{ maxHeight: "200px", overflowY: "auto" }}
              className="border rounded p-2"
            >
              {getAvailableUsers()
                .filter(
                  (person) =>
                    person.name
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    person.email
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase())
                )
                .map((person) => (
                  <Form.Check
                    key={person._id}
                    type="checkbox"
                    id={`group-member-${person._id}`}
                    label={
                      <span>
                        <strong>{person.name}</strong>
                        <span className="text-muted">
                          {" "}
                          ({person.email || person.personalMail})
                        </span>
                      </span>
                    }
                    checked={selectedUsers.includes(person._id)}
                    onChange={() => toggleUserSelection(person._id)}
                    className="mb-1"
                  />
                ))}

              {getAvailableUsers().filter(
                (person) =>
                  person.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  person.email?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <p className="text-muted text-center my-2">
                  No users found matching your search
                </p>
              )}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowNewGroupModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateGroup}
            disabled={
              !groupName.trim() || selectedUsers.length === 0 || loading
            }
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-1"
                  role="status"
                  aria-hidden="true"
                ></span>{" "}
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Group Info Modal */}
      <Modal
        show={showGroupInfoModal && selectedChat?.isGroupChat}
        onHide={() => setShowGroupInfoModal(false)}
        size="lg"
        dialogClassName="modal-dialog-scrollable"
      >
        <Modal.Header
          closeButton
          className="bg-light border-bottom border-2 sticky-top"
        >
          <Modal.Title className="fw-bold text-primary">
            Group Information
          </Modal.Title>
        </Modal.Header>

        {selectedChat && (
          <>
            <div className="sticky-top bg-white px-3 pt-3">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="avatar group-avatar me-3"
                  style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
                >
                  {getAvatarText(selectedChat.chatName)}
                </div>
                <div>
                  <h4>{selectedChat.chatName}</h4>
                  <p className="text-muted mb-0">
                    {selectedChat.participants &&
                    Array.isArray(selectedChat.participants)
                      ? `${selectedChat.participants.length} members`
                      : "0 members"}
                  </p>
                </div>
              </div>
              <hr />
              <h5 className="mb-3">Members</h5>
            </div>

            <Modal.Body className="p-0">
              <div
                className="px-3 mb-3"
                style={{ maxHeight: "350px", overflowY: "auto" }}
              >
                <ListGroup variant="flush">
                  {selectedChat.participants &&
                    Array.isArray(selectedChat.participants) &&
                    selectedChat.participants.map((member) => (
                      <ListGroup.Item
                        key={member._id}
                        className="d-flex align-items-center"
                      >
                        <div className="avatar me-3">
                          {getAvatarText(member.name)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold">
                            {member.name}
                            {member._id === user?._id && " (You)"}
                          </div>
                          <div className="text-muted small">
                            {member.email || member.personalMail || "No email"}
                          </div>
                        </div>
                        {member._id !== user?._id && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveFromGroup(member._id)}
                          >
                            Remove
                          </Button>
                        )}
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </div>

              <hr className="mx-3" />

              <div className="px-3 pb-3">
                <Form className="mt-2">
                  <Form.Group className="mb-3">
                    <Form.Label>Group Name</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        defaultValue={selectedChat.chatName}
                        id="groupNameInput"
                      />
                      <Button
                        variant="primary"
                        className="ms-2"
                        onClick={() => {
                          const newName =
                            document.getElementById("groupNameInput").value;
                          if (newName && newName !== selectedChat.chatName) {
                            handleRenameGroup(newName);
                          }
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Add Members</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search users to add..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {getAvailableUsers()
                        .filter(
                          (u) =>
                            (u.name
                              ?.toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                              u.email
                                ?.toLowerCase()
                                .includes(searchTerm.toLowerCase())) &&
                            !(
                              Array.isArray(selectedChat.participants) &&
                              selectedChat.participants.some((p) => p._id === u._id)
                            )
                        )
                        .map((user) => (
                          <div
                            key={user._id}
                            className="d-flex align-items-center justify-content-between p-2 border-bottom"
                          >
                            <div className="d-flex align-items-center">
                              <div className="avatar me-2">
                                {getAvatarText(user.name)}
                              </div>
                              <span>{user.name}</span>
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleAddToGroup(user._id)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                    </div>
                  </Form.Group>
                </Form>
              </div>
            </Modal.Body>
          </>
        )}

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowGroupInfoModal(false)}
          >
            Close
          </Button>
          <Button variant="danger" onClick={() => handleRemoveFromGroup(user._id)}>
            Leave Group
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Chat;
