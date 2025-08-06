import React, { useState, useEffect } from "react";
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
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    // Manually connect after setup
    newSocket.connect();

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        console.log(API_BASE_URL);
        // Fetch users
        const usersRes = await axios.get(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log(usersRes.data.filter((u) => u.role == "Super_Admin"));

        if (!usersRes.data) throw new Error("No data received for users");
        setUsers(usersRes.data.filter((u) => u.role !== "Super_Admin"));

        // Fetch candidates
        const candidatesRes = await axios.get(
          `${API_BASE_URL}/api/candidates`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (!candidatesRes.data?.data)
          throw new Error("No data received for candidates");
        setCandidates(candidatesRes.data.data || []);

        // Fetch chats
        const chatsRes = await axios.get(`${API_BASE_URL}/api/chat`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("Corresct", chatsRes);

        if (!chatsRes.data) throw new Error("No data received for chats");
        setChats(chatsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
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
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.on("connect", () => {
      socket.emit("setup", user);
    });

    socket.on("messageReceived", (newMessage) => {
      if (selectedChat && selectedChat._id === newMessage.chat._id) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    socket.on("chatCreated", (newChat) => {
      setChats((prev) => [...prev, newChat]);
    });

    return () => {
      socket.off("messageReceived");
      socket.off("chatCreated");
    };
  }, [socket, user, selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/message/${selectedChat._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMessages(res.data);
      } catch (err) {
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      if (!socket || !socket.connected) {
        throw new Error("Not connected to chat server");
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/message`,
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      socket.emit("newMessage", res.data);
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to send message"
      );
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/chat`,
        {
          userId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setSelectedChat(res.data);

      // If this is a new chat, add it to the list
      if (!chats.some((chat) => chat._id === res.data._id)) {
        setChats((prev) => [...prev, res.data]);
      }
      setShowAddFriendModal(false);
    } catch (err) {
      setError("Failed to create chat");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/chat/group`,
        {
          chatName: groupName,
          users: selectedUsers,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setSelectedChat(res.data);
      setChats((prev) => [...prev, res.data]);
      setShowNewGroupModal(false);
      setGroupName("");
      setSelectedUsers([]);
    } catch (err) {
      setError("Failed to create group");
    }
  };

  const handleRenameGroup = async (newName) => {
    if (!selectedChat || !newName.trim()) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/group/rename`,
        {
          chatId: selectedChat._id,
          chatName: newName,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? res.data : chat))
      );
      setSelectedChat(res.data);
    } catch (err) {
      setError("Failed to rename group");
    }
  };

  const handleAddToGroup = async (userId) => {
    if (!selectedChat || !userId) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/group/add`,
        {
          chatId: selectedChat._id,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? res.data : chat))
      );
      setSelectedChat(res.data);
    } catch (err) {
      setError("Failed to add user to group");
    }
  };

  const handleRemoveFromGroup = async (userId) => {
    if (!selectedChat || !userId) return;

    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/group/remove`,
        {
          chatId: selectedChat._id,
          userId,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      setChats((prev) =>
        prev.map((chat) => (chat._id === selectedChat._id ? res.data : chat))
      );
      setSelectedChat(res.data);
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
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getAvatarText = (name) => {
    if (!name) return "??";
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return initials.substring(0, 2);
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

  const getAvailableUsers = () => {
    return [...users, ...candidates].filter((u) => u._id !== user._id);
  };

  if (loading) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
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
          {error}
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
                        onClick={() => setSelectedChat(chat)}
                        className="d-flex align-items-center"
                      >
                        <div className="avatar me-3">
                          {getAvatarText(
                            chat.participants?.find((p) => p._id !== user._id)
                              ?.name || "?"
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong>
                              {chat.participants?.find(
                                (p) => p._id !== user._id
                              )?.name || "Chat"}
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
                        onClick={() => setSelectedChat(chat)}
                        className="d-flex align-items-center"
                      >
                        <div className="avatar me-3 group-avatar">
                          {getAvatarText(chat.chatName)}
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
              <div className="chat-header p-3 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div
                    className={`avatar me-3 ${
                      selectedChat.isGroupChat ? "group-avatar" : ""
                    }`}
                  >
                    {getAvatarText(
                      selectedChat.isGroupChat
                        ? selectedChat.chatName
                        : selectedChat.participants?.find(
                            (p) => p._id !== user._id
                          )?.name
                    )}
                  </div>
                  <div>
                    <h5 className="mb-0">
                      {selectedChat.isGroupChat
                        ? selectedChat.chatName
                        : selectedChat.participants?.find(
                            (p) => p._id !== user._id
                          )?.name}
                    </h5>
                    <small className="text-muted">
                      {selectedChat.isGroupChat
                        ? `${selectedChat.participants?.length || 0} members`
                        : getStatusText(
                            selectedChat.participants?.find(
                              (p) => p._id !== user._id
                            )
                          )}
                    </small>
                  </div>
                </div>
                {selectedChat.isGroupChat && (
                  <div>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      className="me-2"
                    >
                      Group Info
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleDeleteChat}
                    >
                      Leave Group
                    </Button>
                  </div>
                )}
              </div>

              <div className="messages-container flex-grow-1 p-3">
                {messages.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <p className="text-muted">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message mb-3 ${
                        message.sender._id === user._id ? "sent" : "received"
                      }`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="message-input p-3 border-top">
                <Form.Group className="d-flex">
                  <Form.Control
                    as="textarea"
                    rows={1}
                    placeholder={`Message ${
                      selectedChat.isGroupChat
                        ? selectedChat.chatName
                        : selectedChat.participants?.find(
                            (p) => p._id !== user._id
                          )?.name
                    }`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSendMessage()
                    }
                  />
                  <Button
                    variant="primary"
                    className="ms-2"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                  >
                    {loading ? <Spinner size="sm" /> : "Send"}
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
        <Modal.Header closeButton>
          <Modal.Title>Add New Connection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            type="text"
            placeholder="Search people..."
            className="mb-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
                        getStatusText(person).includes("online") ? "online" : ""
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
        <Modal.Header closeButton>
          <Modal.Title>Create New Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Group Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Add Members</Form.Label>
            {getAvailableUsers()
              .filter(
                (person) =>
                  person.name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  person.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((person) => (
                <Form.Check
                  key={person._id}
                  type="checkbox"
                  id={`group-member-${person._id}`}
                  label={`${person.name} (${
                    person.email || person.personalMail
                  })`}
                  checked={selectedUsers.includes(person._id)}
                  onChange={() => toggleUserSelection(person._id)}
                />
              ))}
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
            disabled={!groupName.trim() || selectedUsers.length === 0}
          >
            Create Group
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Chat;


