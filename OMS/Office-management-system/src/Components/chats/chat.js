import React, { useState, useEffect, useRef, useCallback } from "react";
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
import "./chat-new.css";
import { useAuth } from "../AuthProvider/AuthContext"; // Assuming you have an auth context

// Helper to format date as WhatsApp style (Today, Yesterday, or date)
function getDateLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

// Helper to group messages by date
function groupMessagesByDate(messages) {
  const groups = [];
  let lastDate = null;
  messages.forEach((msg) => {
    if (!msg.createdAt) return;
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      groups.push({ type: 'date', date: msg.createdAt });
      lastDate = msgDate;
    }
    groups.push({ type: 'message', message: msg });
  });
  return groups;
}

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [inAppNotifications, setInAppNotifications] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const typingTimeout = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

  // Responsive hook to detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
                    window.matchMedia("(max-width: 768px)").matches ||
                    'ontouchstart' in window ||
                    navigator.maxTouchPoints > 0;
      setIsMobile(mobile);
      
      // Remove mobile-chat-open class when switching to desktop
      if (!mobile) {
        const chatContainer = document.querySelector(".chat-container");
        if (chatContainer) {
          chatContainer.classList.remove("mobile-chat-open");
        }
        // Detect navbar state for desktop
        detectNavbarState();
      }
    };

    // Function to detect navbar state and apply responsive classes
    const detectNavbarState = () => {
      const chatContainer = document.querySelector('.chat-container.container-fluid');
      if (!chatContainer) return;

      // Remove all navbar state classes first
      chatContainer.classList.remove('navbar-expanded', 'navbar-collapsed', 'navbar-hidden');

      // Check for sidebar container and its state
      const sidebarContainer = document.querySelector('.sidebar-container');
      if (!sidebarContainer) {
        // No sidebar found - navbar hidden
        chatContainer.classList.add('navbar-hidden');
        return;
      }

      // Check if sidebar is open (desktop: always open, mobile: check open class)
      const isDesktop = window.innerWidth > 768;
      const isOpen = isDesktop || sidebarContainer.classList.contains('open');
      
      if (!isOpen) {
        chatContainer.classList.add('navbar-hidden');
        return;
      }

      // Check if sidebar is collapsed
      const isCollapsed = sidebarContainer.classList.contains('collapsed');
      if (isCollapsed) {
        chatContainer.classList.add('navbar-collapsed');
      } else {
        chatContainer.classList.add('navbar-expanded');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    // Set up observers for navbar state changes with a delay to ensure DOM is ready
    const setupNavbarObserver = () => {
      const sidebarContainer = document.querySelector('.sidebar-container');
      if (sidebarContainer && window.innerWidth > 768) {
        const observer = new MutationObserver(() => {
          detectNavbarState();
        });
        
        observer.observe(sidebarContainer, {
          attributes: true,
          attributeFilter: ['class']
        });
        
        return observer;
      }
      return null;
    };

    const timeoutId = setTimeout(() => {
      const observer = setupNavbarObserver();
      
      // Store observer for cleanup
      if (observer) {
        window.navbarObserver = observer;
      }
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (window.navbarObserver) {
        window.navbarObserver.disconnect();
        delete window.navbarObserver;
      }
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Reset textarea height when message is cleared
  useEffect(() => {
    if (!newMessage) {
      const textarea = document.querySelector('.message-input .form-control');
      if (textarea) {
        textarea.style.height = '44px';
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [newMessage]);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      console.log("Current notification permission:", Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission granted:", permission);
        });
      }
    } else {
      console.log("Browser doesn't support notifications");
    }
  }, []);

  // Function to show browser notification with sound
  const showNotification = useCallback((message) => {
    console.log("🔔 Attempting to show notification for message:", message);
    
    // Play notification sound first
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log("🔊 Notification sound played");
    } catch (error) {
      console.log("🔇 Could not play notification sound:", error);
    }
    
    // Always show in-app notification as fallback
    const inAppNotification = {
      id: Date.now(),
      senderName: message.sender?.name || "Someone",
      content: message.content,
      chatId: message.chat._id || message.chat,
      timestamp: new Date(),
    };
    
    setInAppNotifications(prev => [...prev, inAppNotification]);
    
    // Auto remove in-app notification after 5 seconds
    setTimeout(() => {
      setInAppNotifications(prev => prev.filter(notif => notif.id !== inAppNotification.id));
    }, 5000);
    
    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.log("Browser doesn't support notifications, using in-app notification only");
      return;
    }

    // Check permission status
    console.log("Notification permission status:", Notification.permission);
    
    if (Notification.permission === "granted") {
      const senderName = message.sender?.name || "Someone";
      const chatName = message.chat?.chatName || (
        message.chat?.isGroupChat ? "Group Chat" : senderName
      );
      
      console.log("🔔 Creating browser notification for:", senderName);
      
      try {
        const notification = new Notification(`💬 New message from ${senderName}`, {
          body: message.content.length > 100 ? message.content.substring(0, 100) + "..." : message.content,
          icon: "/favicon.ico", // You can change this to your app icon
          tag: message.chat._id || message.chat, // Prevent duplicate notifications for same chat
          badge: "/favicon.ico",
          requireInteraction: false, // Auto-dismiss after timeout
          silent: false // Allow system sound
        });

        console.log("✅ Browser notification created successfully");

        // Auto close notification after 6 seconds
        setTimeout(() => {
          notification.close();
        }, 6000);
        
        // Handle notification click to focus on chat
        notification.onclick = () => {
          console.log("🖱️ Notification clicked - focusing window");
          window.focus();
          notification.close();
          
          // Try to bring the window to front
          if (window.parent) {
            window.parent.focus();
          }
        };
      } catch (error) {
        console.error("❌ Error creating browser notification:", error);
      }
    } else if (Notification.permission === "denied") {
      console.log("🚫 Notifications are denied by user, using in-app notification only");
    } else if (Notification.permission === "default") {
      console.log("❓ Requesting notification permission...");
      Notification.requestPermission().then((permission) => {
        console.log("Permission result:", permission);
        if (permission === "granted") {
          console.log("✅ Permission granted, retrying notification");
          // Retry showing notification
          showNotification(message);
        }
      });
    }
  }, [setInAppNotifications]); // Dependencies for useCallback

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
      autoConnect: true, // Automatically connect
      upgrade: true, // Allow transport upgrades
    });

    newSocket.on("connect", () => {
      console.log("Socket connected successfully with ID:", newSocket.id);
      console.log("Sending setup data for user:", user._id);

      // Setup user in socket
      newSocket.emit("setup", user);

      // Join user to their personal room for receiving messages
      newSocket.emit("join", user._id);

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
      // Re-setup user and re-join chat when reconnected
      if (user) {
        newSocket.emit("setup", user);
        newSocket.emit("join", user._id);
        if (selectedChat) {
          newSocket.emit("join chat", selectedChat._id);
        }
      }
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

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const chatContainer = document.querySelector(".chat-container");
      if (chatContainer && selectedChat) {
        if (
          window.innerWidth <= 768 ||
          window.matchMedia("(max-width: 768px)").matches
        ) {
          chatContainer.classList.add("mobile-chat-open");
        } else {
          chatContainer.classList.remove("mobile-chat-open");
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [selectedChat]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        setChatsLoading(true);
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
      } catch (candidateError) {
        console.error("Error fetching candidates:", candidateError);
        setCandidates([]);
      }
      setInitialLoading(false);
      setChatsLoading(false);
    };

    fetchData();
    
    // Set initial loading to false after first load attempt
    setTimeout(() => setInitialLoading(false), 1000);
  }, [API_BASE_URL]);

  // Poll for chats, users, candidates every 2 seconds
useEffect(() => {
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      // Fetch users
      try {
        const usersRes = await axios.get(`${API_BASE_URL}/users`, {
          headers,
        });
        if (usersRes.data && Array.isArray(usersRes.data)) {
          setUsers(usersRes.data.filter((u) => u.role !== "Super_Admin"));
        } else {
          setUsers([]);
        }
      } catch {
        setUsers([]);
      }
      // Fetch candidates
      try {
        const candidatesRes = await axios.get(
          `${API_BASE_URL}/api/candidates`,
          { headers }
        );
        if (
          candidatesRes.data?.data &&
          Array.isArray(candidatesRes.data.data)
        ) {
          setCandidates(candidatesRes.data.data);
        } else if (Array.isArray(candidatesRes.data)) {
          setCandidates(candidatesRes.data);
        } else {
          setCandidates([]);
        }
      } catch {
        setCandidates([]);
      }
      // Fetch chats
      try {
        const axiosInstance = axios.create({
          baseURL: API_BASE_URL,
          withCredentials: true,
          timeout: 15000,
          headers,
        });
        const chatsRes = await axiosInstance.get("/api/chat");
        if (Array.isArray(chatsRes.data)) {
          const chatsData = chatsRes.data;
          setChats(chatsData);
          // Dispatch event for sidebar notification
          window.dispatchEvent(new CustomEvent("chat-unread-status", {
            detail: { chats: chatsData }
          }));
        } else if (
          chatsRes.data?.data?.chats &&
          Array.isArray(chatsRes.data.data.chats)
        ) {
          const chatsData = chatsRes.data.data.chats;
          setChats(chatsData);
          // Dispatch event for sidebar notification
          window.dispatchEvent(new CustomEvent("chat-unread-status", {
            detail: { chats: chatsData }
          }));
        } else if (
          chatsRes.data?.chats &&
          Array.isArray(chatsRes.data.chats)
        ) {
          const chatsData = chatsRes.data.chats;
          setChats(chatsData);
          // Dispatch event for sidebar notification
          window.dispatchEvent(new CustomEvent("chat-unread-status", {
            detail: { chats: chatsData }
          }));
        } else {
          setChats([]);
          // Dispatch event for sidebar notification with empty array
          window.dispatchEvent(new CustomEvent("chat-unread-status", {
            detail: { chats: [] }
          }));
        }
      } catch {
        setChats([]);
        // Dispatch event for sidebar notification with empty array
        window.dispatchEvent(new CustomEvent("chat-unread-status", {
          detail: { chats: [] }
        }));
      }
    } catch {}
  };
  fetchData();
}, [API_BASE_URL]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      try {
        setMessagesLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/api/message/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
            timeout: 10000,
          }
        );
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          setMessages(response.data.data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        setError("Failed to load messages");
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChat, API_BASE_URL]);

// Define handleMessageReceived with useCallback to prevent unnecessary re-renders
const handleMessageReceived = useCallback((newMessageReceived) => {
  console.log("📨 Received message from socket:", newMessageReceived);
  console.log("📨 Message details:", {
    messageId: newMessageReceived._id,
    senderId: newMessageReceived.sender?._id,
    currentUserId: user._id,
    chatId: newMessageReceived.chat?._id || newMessageReceived.chat,
    selectedChatId: selectedChat?._id,
    content: newMessageReceived.content
  });
  
  // Determine the chat ID from the message
  const chatId = newMessageReceived.chat._id || newMessageReceived.chat;
  
  // Check if this message is for the currently selected chat
  const isCurrentChat = selectedChat && selectedChat._id === chatId;
  
  // Check if this message is from the current user
  const isFromCurrentUser = newMessageReceived.sender._id === user._id;
  
  console.log("📨 Processing flags:", {
    isCurrentChat,
    isFromCurrentUser,
    shouldShowInCurrentChat: isCurrentChat && !isFromCurrentUser
  });
  
  // IMPORTANT: Skip processing our own messages for the current chat to avoid duplicates
  // We already show our own messages immediately when sending via the temp message system
  if (isFromCurrentUser && isCurrentChat) {
    console.log("🚫 Skipping own message for current chat to avoid duplicate");
    return;
  }
  
  // Update the chat list with latest message and notification status
  setChats((prev) => {
    const updated = prev.map((chat) => {
      if (chat._id === chatId) {
        // Only increment unread count for messages from other users and not in current chat
        const shouldIncrementUnread = !isFromCurrentUser && !isCurrentChat;
        
        return {
          ...chat,
          latestMessage: newMessageReceived,
          unreadCount: shouldIncrementUnread ? (chat.unreadCount || 0) + 1 : (chat.unreadCount || 0),
          notification: shouldIncrementUnread ? true : chat.notification
        };
      }
      return chat;
    });
    
    // Dispatch event for sidebar notification
    window.dispatchEvent(new CustomEvent("chat-unread-status", {
      detail: { chats: updated }
    }));
    
    return updated;
  });
  
  // Add message to current chat if it's for the selected chat AND from another user
  if (isCurrentChat && !isFromCurrentUser) {
    console.log("📬 Adding message from other user to current chat");
    setMessages((prev) => {
      // Check if message already exists to avoid duplicates
      const messageExists = prev.some(msg => msg._id === newMessageReceived._id);
      if (messageExists) {
        console.log("⚠️ Message already exists, skipping duplicate");
        return prev;
      }
      console.log("✅ Adding new message to current chat - REAL TIME UPDATE");
      const newMessages = [...prev, newMessageReceived];
      
      // Force a re-render by creating a new array reference
      console.log("🔄 Total messages after adding:", newMessages.length);
      return newMessages;
    });
    
    // Also force scroll to bottom after a small delay to ensure DOM update
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        console.log("📜 Auto-scrolled to bottom for new message");
      }
    }, 100);
  } 
  
  // Show notification for ALL messages from other users in other chats (not the current chat)
  if (!isFromCurrentUser && !isCurrentChat) {
    console.log("🔔 Message from another user in a different chat - showing notification");
    console.log("🔔 Notification details:", {
      isCurrentChat,
      senderName: newMessageReceived.sender.name,
      chatName: newMessageReceived.chat?.chatName || "Direct Message",
      currentChatName: selectedChat?.chatName || "Direct Message"
    });
    showNotification(newMessageReceived);
  }
}, [selectedChat, user._id, setChats, setMessages, showNotification]);

// Track joined rooms to prevent duplicate joins
const [joinedRooms, setJoinedRooms] = useState(new Set());

// Join ALL user's chat rooms for real-time notifications
const joinAllChatRooms = useCallback(() => {
  if (socket && socket.connected && chats.length > 0) {
    const roomsToJoin = chats.filter(chat => !joinedRooms.has(chat._id));
    
    if (roomsToJoin.length > 0) {
      console.log("🏠 Joining new chat rooms for real-time notifications:", roomsToJoin.length, "new rooms out of", chats.length, "total");
      
      roomsToJoin.forEach(chat => {
        socket.emit("join chat", chat._id);
        console.log("🔗 Joined chat room:", chat._id, chat.chatName || "Direct Message");
      });
      
      // Update joined rooms set
      setJoinedRooms(prev => {
        const newSet = new Set(prev);
        roomsToJoin.forEach(chat => newSet.add(chat._id));
        return newSet;
      });
    } else {
      console.log("✅ All chat rooms already joined (", chats.length, "rooms)");
    }
  } else {
    console.log("❌ Cannot join chat rooms:", {
      socketConnected: socket?.connected,
      chatsCount: chats.length
    });
  }
}, [socket, chats, joinedRooms]);

// Setup socket listeners for real-time updates
useEffect(() => {
  if (!socket) return;

  // Listen for new messages

    // Listen for typing indicators
    const handleTyping = (data) => {
      console.log("Typing event received:", data);
      if (
        selectedChat &&
        selectedChat._id === data.chatId &&
        data.userId !== user._id
      ) {
        setIsTyping(true);
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    const handleStopTyping = (data) => {
      console.log("Stop typing event received:", data);
      if (selectedChat && selectedChat._id === data.chatId) {
        setTypingUsers((prev) => {
          const newTypingUsers = prev.filter(
            (userId) => userId !== data.userId
          );
          if (newTypingUsers.length === 0) {
            setIsTyping(false);
          }
          return newTypingUsers;
        });
      }
    };

  // Join chat room when chat is selected
  const handleJoinChat = () => {
    if (selectedChat && socket.connected) {
      console.log("🏠 Joining chat room:", selectedChat._id);
      socket.emit("join chat", selectedChat._id);
      
      // Add listener for join confirmation
      socket.once("joined chat", (chatId) => {
        console.log("✅ Successfully joined chat room:", chatId);
      });
    } else {
      console.log("❌ Cannot join chat room:", {
        hasSelectedChat: !!selectedChat,
        socketConnected: socket?.connected,
        selectedChatId: selectedChat?._id
      });
    }
  };

  // Add event listeners with better error handling
  const messageHandler = (data) => {
    console.log("🎯 Direct message handler called with:", data);
    handleMessageReceived(data);
  };
  
  socket.on("message received", messageHandler);
  socket.on("typing", handleTyping);
  socket.on("stop typing", handleStopTyping);
  
  // Also listen for alternative event names (just in case)
  socket.on("new message", messageHandler);
  socket.on("messageReceived", messageHandler);
  
  // Join the chat room for real-time updates
  handleJoinChat();
  
  // Join all chat rooms for real-time notifications (only if not already joined)
  if (chats.length > 0) {
    joinAllChatRooms();
  }

  // Add debug listeners
  socket.on("connect", () => {
    console.log("✅ Socket connected in message handler:", socket.id);
    // Clear joined rooms on new connection
    setJoinedRooms(new Set());
    
    // Re-join chat room on reconnection
    if (selectedChat) {
      console.log("🔄 Re-joining current chat room after connection:", selectedChat._id);
      socket.emit("join chat", selectedChat._id);
    }
    // Join all chat rooms for real-time notifications (will only join new ones)
    joinAllChatRooms();
  });
  
  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected in message handler");
    // Clear joined rooms tracking on disconnect
    setJoinedRooms(new Set());
  });

  // Cleanup function
  return () => {
    socket.off("message received", messageHandler);
    socket.off("new message", messageHandler);
    socket.off("messageReceived", messageHandler);
    socket.off("typing", handleTyping);
    socket.off("stop typing", handleStopTyping);
    
    // Leave chat room when cleanup
    if (selectedChat && socket.connected) {
      console.log("🚪 Leaving chat room:", selectedChat._id);
      socket.emit("leave chat", selectedChat._id);
    }
  };
}, [socket, selectedChat, user._id, handleMessageReceived, chats, joinAllChatRooms, setJoinedRooms]);

// Join all chat rooms when chats are loaded or updated
useEffect(() => {
  if (socket && socket.connected && chats.length > 0) {
    // Only join if we have new chats that aren't already joined
    const newChats = chats.filter(chat => !joinedRooms.has(chat._id));
    if (newChats.length > 0) {
      console.log("🔄 New chats detected, joining", newChats.length, "new chat rooms");
      joinAllChatRooms();
    }
  }
}, [chats, socket, joinAllChatRooms, joinedRooms]);

// Add a test function to manually trigger notifications (for debugging)
const testNotification = () => {
  console.log("🧪 Testing notification system...");
  const testMessage = {
    _id: "test-" + Date.now(),
    sender: { _id: "test-user", name: "Test User" },
    content: "This is a test notification message!",
    chat: { _id: "test-chat" },
    createdAt: new Date()
  };
  showNotification(testMessage);
};

// Expose test function globally for debugging
window.testNotification = testNotification;

// Add a test function to verify real-time functionality
const testRealtimeConnection = () => {
  if (socket && socket.connected) {
    console.log("🧪 Testing real-time connection...");
    console.log("🧪 Socket status:", {
      connected: socket.connected,
      id: socket.id,
      rooms: Array.from(socket.rooms || []),
      selectedChat: selectedChat?._id,
      userId: user._id
    });
    
    // Send a ping to test connection
    socket.emit("ping", { test: true, timestamp: new Date() });
    
    // Check if properly joined chat room
    if (selectedChat) {
      console.log("🧪 Re-joining chat room to ensure connection:", selectedChat._id);
      socket.emit("join chat", selectedChat._id);
    }
  } else {
    console.error("🧪 Socket not connected for real-time test");
  }
};

// Expose test function globally for debugging
window.testRealtimeConnection = testRealtimeConnection;

  // Debug socket connection status
  useEffect(() => {
    if (socket) {
      const handleConnect = () => console.log("Socket connected:", socket.id);
      const handleDisconnect = () => console.log("Socket disconnected");
      const handleConnectError = (error) =>
        console.error("Socket connection error:", error);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);

      // Log current status
      console.log("Socket status:", {
        connected: socket.connected,
        id: socket.id,
        transport: socket.io?.engine?.transport?.name,
      });

      return () => {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("connect_error", handleConnectError);
      };
    }
  }, [socket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMessage) {
      console.log("Cannot send message: missing message or chat or already sending");
      return;
    }

    // Set sending state
    setSendingMessage(true);

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
      socket.emit("stop typing", {
        chatId: selectedChat._id,
        userId: user._id,
      });
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
      const messageData =
        response.data.data?.message || response.data.message || response.data;

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
      // Emit with proper structure including full message data
      socket.emit("new message", {
        ...messageData,
        chat: {
          _id: selectedChat._id,
          ...selectedChat // Include full chat data for better handling
        }
      });
      console.log("✅ Message emitted successfully to socket");
    } else {
      console.warn(
        "⚠️ Socket disconnected, message sent but real-time updates unavailable"
      );
      console.log("Socket status:", {
        exists: !!socket,
        connected: socket?.connected,
        id: socket?.id
      });
    }

    // Reset sending state on success
    setSendingMessage(false);
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
    
    // Reset sending state on error
    setSendingMessage(false);
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

// Function to clear notifications for a specific chat
const clearChatNotifications = (chatId) => {
  setChats((prev) => {
    const updated = prev.map((chat) =>
      chat._id === chatId
        ? { ...chat, unreadCount: 0, notification: false }
        : chat
    );
    
    // Dispatch event for sidebar notification
    window.dispatchEvent(new CustomEvent("chat-unread-status", {
      detail: { chats: updated }
    }));
    
    return updated;
  });
};

  // Enhanced chat selection handler with improved mobile responsiveness
  const handleChatSelect = (chat, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setSelectedChat(chat);
    clearChatNotifications(chat._id);

    // Use state-based mobile detection
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer && isMobile) {
      chatContainer.classList.add("mobile-chat-open");
      console.log("Mobile chat opened for:", chat.chatName || chat.participants?.find(p => p._id !== user._id)?.name || "Chat");
      
      // Scroll to top of chat area on mobile
      const chatArea = document.querySelector(".chat-area");
      if (chatArea) {
        chatArea.scrollTop = 0;
      }
    }
  };

  // Enhanced mobile back button handler
  const handleMobileBack = () => {
    const chatContainer = document.querySelector(".chat-container");
    if (chatContainer) {
      chatContainer.classList.remove("mobile-chat-open");
      // Keep selected chat but hide chat area on mobile
      console.log("Mobile chat closed, returning to chat list");
      
      // Scroll to top of sidebar on mobile
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        sidebar.scrollTop = 0;
      }
    }
  };

  // Function to detect and render clickable links in messages
  const renderMessageWithLinks = (text) => {
    if (!text || typeof text !== "string") return text;

    // Enhanced regular expression to detect URLs (including email addresses)
    const urlRegex =
      /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?|www\.(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?|(?:[-\w.])+\.(?:[a-zA-Z]{2,})(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?)/gi;

    // Split text by URLs while keeping the URLs
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Reset regex for testing (regex has global flag)
      urlRegex.lastIndex = 0;

      // Check if this part is a URL
      if (urlRegex.test(part)) {
        // Ensure the URL has a protocol
        let fullUrl = part;
        if (!part.startsWith("http://") && !part.startsWith("https://")) {
          fullUrl = part.startsWith("www.")
            ? `https://${part}`
            : `https://${part}`;
        }

        // Truncate long URLs for display
        const displayUrl =
          part.length > 50 ? `${part.substring(0, 47)}...` : part;

        return (
          <a
            key={index}
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link"
            title={fullUrl} // Show full URL on hover
            onClick={(e) => {
              e.stopPropagation(); // Prevent any parent click handlers
              // Additional confirmation for external links
              if (!fullUrl.includes(window.location.hostname)) {
                const confirmed = window.confirm(
                  `This link will open in a new tab:\n${fullUrl}\n\nDo you want to continue?`
                );
                if (!confirmed) {
                  e.preventDefault();
                }
              }
            }}
          >
            {displayUrl}
          </a>
        );
      }

      // Return regular text
      return part;
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, selectedChat]);

  // Auto-scroll when textarea height changes
  useEffect(() => {
    if (newMessage) {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        const isScrolledToBottom = messagesContainer.scrollHeight - messagesContainer.clientHeight <= messagesContainer.scrollTop + 50;
        if (isScrolledToBottom) {
          requestAnimationFrame(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          });
        }
      }
    }
  }, [newMessage]);

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

  if (initialLoading && !user) {
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
    {/* In-App Notifications */}
    <div className="in-app-notifications">
      {inAppNotifications.map((notification) => (
        <div key={notification.id} className="in-app-notification">
          <div className="notification-header">
            <strong>New message from {notification.senderName}</strong>
            <button 
              className="notification-close" 
              onClick={() => setInAppNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              ×
            </button>
          </div>
          <div className="notification-body">
            {notification.content}
          </div>
        </div>
      ))}
    </div>

    {/* Left sidebar - Chats list */}
    <div className="sidebar">
      {/* Mobile Office Chat Header */}
      <div className="office-chat-header">
        <i className="fas fa-comments me-2"></i>
        Office Chat
      </div>
      
      {/* Mobile Buttons Container */}
      <div className="mobile-buttons-container">
        <div className="sidebar-buttons">
          <button 
            className="sidebar-button"
            onClick={() => setShowAddFriendModal(true)}
          >
            <i className="fas fa-user-plus me-1"></i>
            Add Friend
          </button>
          <button 
            className="sidebar-button"
            onClick={() => setShowNewGroupModal(true)}
          >
            <i className="fas fa-users me-1"></i>
            New Group
          </button>
        </div>
      </div>
        
        {/* Desktop Header */}
        <div className="sidebar-header p-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-white d-flex align-items-center">
            <i className="fas fa-comments me-2"></i>
            Office Chat
          </h5>
          <div className="btn-cont">
            <Button
              variant="light"
              size="sm"
              onClick={() => setShowAddFriendModal(true)}
              className="me-2"
            >
              <i className="fas fa-user-plus me-1"></i>
              Add Friend
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setShowNewGroupModal(true)}
            >
              <i className="fas fa-users me-1"></i>
              New Group
            </Button>
          </div>
        </div>

          <Tab.Container
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="tab-container"
          >
            <Nav variant="tabs" className="px-3 pt-2 flex-shrink-0">
              <Nav.Item>
                <Nav.Link eventKey="personal">Chats</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="groups">Groups</Nav.Link>
              </Nav.Item>
            </Nav>

          <Tab.Content className="tab-content p-2">
            <Tab.Pane eventKey="personal">
              <Form.Control
                type="text"
                placeholder="Search chats..."
                className="mb-3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ListGroup variant="flush">
                {chatsLoading ? (
                  <div className="d-flex justify-content-center align-items-center py-4">
                    <div className="text-center">
                      <Spinner animation="border" variant="primary" size="sm" />
                      <p className="text-muted mt-2 mb-0 small">Loading chats...</p>
                    </div>
                  </div>
                ) : chats
                  .filter((chat) => !chat.isGroupChat)
                  .filter(
                    (chat) =>
                      chat.chatName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      chat.participants?.some((p) =>
                        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                  ).length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted mb-0 small">
                      {searchTerm ? `No chats found matching "${searchTerm}"` : "No personal chats yet"}
                    </p>
                  </div>
                ) : chats
                  .filter((chat) => !chat.isGroupChat)
                  .filter(
                    (chat) =>
                      chat.chatName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      chat.participants?.some((p) =>
                        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                  )
                  .map((chat) => (
                    <ListGroup.Item
                      key={chat._id}
                      action
                      active={selectedChat?._id === chat._id}
                      onClick={(e) => handleChatSelect(chat, e)}
                      className="d-flex align-items-center"
                    >
                      <div
                        className="avatar me-3"
                        style={{ position: "relative" }}
                      >
                        {getAvatarText(
                          chat.participants && Array.isArray(chat.participants)
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
                          <span className="badge">
                            {chat.unreadCount > 0
                              ? chat.unreadCount > 9
                                ? "9+"
                                : chat.unreadCount
                              : ""}
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
                            {chat.latestMessage && chat.latestMessage.createdAt
                              ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "--:--"}
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
                  {chatsLoading ? (
                    <div className="d-flex justify-content-center align-items-center py-4">
                      <div className="text-center">
                        <Spinner animation="border" variant="primary" size="sm" />
                        <p className="text-muted mt-2 mb-0 small">Loading groups...</p>
                      </div>
                    </div>
                  ) : chats
                    .filter((chat) => chat.isGroupChat)
                    .filter((chat) =>
                      chat.chatName
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    ).length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0 small">
                        {searchTerm ? `No groups found matching "${searchTerm}"` : "No group chats yet"}
                      </p>
                    </div>
                  ) : chats
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
                        onClick={(e) => handleChatSelect(chat, e)}
                        className="d-flex align-items-center"
                      >
                        <div
                          className="avatar me-3 group-avatar"
                          style={{ position: "relative" }}
                        >
                          {getAvatarText(chat.chatName)}
                          {(chat.unreadCount > 0 || chat.notification) && (
                            <span className="badge">
                              {chat.unreadCount > 0
                                ? chat.unreadCount > 9
                                  ? "9+"
                                  : chat.unreadCount
                                : ""}
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
        </div>

        {/* Right side - Chat area */}
        <div className="chat-area">
          {selectedChat ? (
            <>
              {/* Mobile Chat Header */}
              <div className="mobile-chat-header">
                <button
                  className="mobile-back-button"
                  onClick={handleMobileBack}
                  aria-label="Back to chat list"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <div className="mobile-chat-title">
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
                <div className="mobile-chat-actions">
                  {selectedChat.isGroupChat && (
                    <button
                      className="mobile-action-button"
                      title="Group Info"
                      onClick={() => setShowGroupInfoModal(true)}
                    >
                      <i className="fas fa-info-circle"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop Chat Header */}
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
                  <div className="chat-header-status">
                    {messagesLoading ? (
                      <span className="text-muted small">
                        <Spinner animation="border" size="sm" className="me-1" style={{width: '12px', height: '12px'}} />
                        Loading messages...
                      </span>
                    ) : selectedChat.isGroupChat
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

            <div className="messages-container">
              {messagesLoading ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p className="text-muted mt-2 mb-0">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <p className="text-muted">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                groupMessagesByDate(messages).map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div
                        key={"date-" + item.date + idx}
                        className="date-separator"
                      >
                        <div className="date-separator-line"></div>
                        <div className="date-separator-text">
                          {getDateLabel(item.date)}
                        </div>
                        <div className="date-separator-line"></div>
                      </div>
                    );
                  }
                  const message = item.message;
                  if (!message || !message._id) return null;
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
                          {renderMessageWithLinks(message.content || "")}
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
                                      prev.filter((m) => m._id !== message._id)
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
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}>
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
                        
                        // Auto-resize textarea
                        const textarea = e.target;
                        textarea.style.height = 'auto';
                        const scrollHeight = textarea.scrollHeight;
                        const maxHeight = 120; // 120px max height
                        const minHeight = 44; // 44px min height
                        
                        if (scrollHeight <= maxHeight) {
                          textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
                          textarea.style.overflowY = 'hidden';
                        } else {
                          textarea.style.height = maxHeight + 'px';
                          textarea.style.overflowY = 'auto';
                        }
                        
                        // Handle typing indicators
                        if (socket && socket.connected && selectedChat) {
                          // Emit 'typing' event only if not already typing
                          if (!typingTimeout.current) {
                            socket.emit("typing", {
                              chatId: selectedChat._id,
                              userId: user._id,
                            });
                          } else {
                            clearTimeout(typingTimeout.current);
                          }
                          // Always reset the timeout
                          typingTimeout.current = setTimeout(() => {
                            socket.emit("stop typing", {
                              chatId: selectedChat._id,
                              userId: user._id,
                            });
                            typingTimeout.current = null;
                          }, 1500); // 1.5s after last keypress
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onInput={(e) => {
                        // Additional auto-resize on input
                        const textarea = e.target;
                        textarea.style.height = 'auto';
                        const scrollHeight = textarea.scrollHeight;
                        const maxHeight = 120;
                        const minHeight = 44;
                        
                        if (scrollHeight <= maxHeight) {
                          textarea.style.height = Math.max(scrollHeight, minHeight) + 'px';
                          textarea.style.overflowY = 'hidden';
                        } else {
                          textarea.style.height = maxHeight + 'px';
                          textarea.style.overflowY = 'auto';
                        }
                      }}
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    />
                    <Button
                      type="submit"
                      variant="link"
                      className={`send-button ${newMessage.trim() ? 'active' : ''} ${sendingMessage ? 'sending' : ''}`}
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? (
                        <div className="sending-indicator">
                          <i className="fas fa-circle-notch fa-spin"></i>
                        </div>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </Button>
                  </Form.Group>
                </Form>
              </div>
            </>
          ) : (
            <div className="welcome-screen">
              <div className="text-center">
                <div className="welcome-icon" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>💬</div>
                <h4 className="welcome-title">Welcome to Office Chat</h4>
                <p className="welcome-description">
                  {chats.length === 0
                    ? "Start connecting with your colleagues by adding friends or creating group chats"
                    : "Select a conversation to start chatting"}
                </p>
                <div className="welcome-actions d-flex gap-3 justify-content-center flex-wrap">
                  <Button
                    variant="primary"
                    onClick={() => setShowAddFriendModal(true)}
                    className="d-flex align-items-center gap-2 welcome-btn"
                  >
                    <span>👥</span>
                    Add Friend
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowNewGroupModal(true)}
                    className="d-flex align-items-center gap-2 welcome-btn"
                  >
                    <span>🏢</span>
                    Create Group
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

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
        >
          <div className="scrollable-user-list">
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
              {getAvailableUsers().filter(
                (person) =>
                  person.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  person.email?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-center py-4">
                  <div className="text-muted">
                    <i className="fas fa-users fa-2x mb-3 d-block"></i>
                    {searchTerm ? 
                      `No users found matching "${searchTerm}"` : 
                      "No users available to add"
                    }
                  </div>
                </div>
              )}
            </ListGroup>
          </div>
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

            <div className="scrollable-user-list border rounded p-2">
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
                    <div className="scrollable-user-list">
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
                              selectedChat.participants.some(
                                (p) => p._id === u._id
                              )
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
          <Button
            variant="danger"
            onClick={() => handleRemoveFromGroup(user._id)}
          >
            Leave Group
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Chat;
