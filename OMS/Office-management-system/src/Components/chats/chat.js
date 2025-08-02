import React, { useState, useEffect } from 'react';
import { Container, Row, Col, ListGroup, Form, Button, Badge, Modal, Tab, Nav, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { io } from 'socket.io-client';
import './chat.css';
import { useAuth } from '../AuthProvider/AuthContext'; // Assuming you have an auth context

const Chat = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [candidates, setCandidates] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://142.93.213.81:5001';

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('token')
      }
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
        
        console.log(API_BASE_URL)
        // Fetch users
        const usersRes = await axios.get(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log(usersRes.data.filter(u => u.role == 'Super_Admin'))
        
        if (!usersRes.data) throw new Error('No data received for users');
        setUsers(usersRes.data.filter(u => u.role !== 'Super_Admin'));
    
        // Fetch candidates
        const candidatesRes = await axios.get(`${API_BASE_URL}/api/candidates`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!candidatesRes.data?.data) throw new Error('No data received for candidates');
        setCandidates(candidatesRes.data.data || []);
        
        // Fetch chats
        const chatsRes = await axios.get(`${API_BASE_URL}/api/chat`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log("Corresct",chatsRes)
        
        if (!chatsRes.data) throw new Error('No data received for chats');
        setChats(chatsRes.data);
    
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('connect', () => {
      socket.emit('setup', user);
    });

    socket.on('messageReceived', (newMessage) => {
      if (selectedChat && selectedChat._id === newMessage.chat._id) {
        setMessages(prev => [...prev, newMessage]);
      }
    });

    socket.on('chatCreated', (newChat) => {
      setChats(prev => [...prev, newChat]);
    });

    return () => {
      socket.off('messageReceived');
      socket.off('chatCreated');
    };
  }, [socket, user, selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/message/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setMessages(res.data);
      } catch (err) {
        setError('Failed to load messages');
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
        throw new Error('Not connected to chat server');
      }
  
      const res = await axios.post(`${API_BASE_URL}/api/message`, {
        content: newMessage,
        chatId: selectedChat._id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
  
      socket.emit('newMessage', res.data);
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    }
  };

  const handleAddFriend = async (userId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/chat`, { 
        userId 
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSelectedChat(res.data);
      
      // If this is a new chat, add it to the list
      if (!chats.some(chat => chat._id === res.data._id)) {
        setChats(prev => [...prev, res.data]);
      }
      setShowAddFriendModal(false);
    } catch (err) {
      setError('Failed to create chat');
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    try {
      const res = await axios.post(`${API_BASE_URL}/api/chat/group`, {
        chatName: groupName,
        users: selectedUsers
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setSelectedChat(res.data);
      setChats(prev => [...prev, res.data]);
      setShowNewGroupModal(false);
      setGroupName('');
      setSelectedUsers([]);
    } catch (err) {
      setError('Failed to create group');
    }
  };

  const handleRenameGroup = async (newName) => {
    if (!selectedChat || !newName.trim()) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/api/group/rename`, {
        chatId: selectedChat._id,
        chatName: newName
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setChats(prev => prev.map(chat => 
        chat._id === selectedChat._id ? res.data : chat
      ));
      setSelectedChat(res.data);
    } catch (err) {
      setError('Failed to rename group');
    }
  };

  const handleAddToGroup = async (userId) => {
    if (!selectedChat || !userId) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/api/group/add`, {
        chatId: selectedChat._id,
        userId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setChats(prev => prev.map(chat => 
        chat._id === selectedChat._id ? res.data : chat
      ));
      setSelectedChat(res.data);
    } catch (err) {
      setError('Failed to add user to group');
    }
  };

  const handleRemoveFromGroup = async (userId) => {
    if (!selectedChat || !userId) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/api/group/remove`, {
        chatId: selectedChat._id,
        userId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setChats(prev => prev.map(chat => 
        chat._id === selectedChat._id ? res.data : chat
      ));
      setSelectedChat(res.data);
    } catch (err) {
      setError('Failed to remove user from group');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/chat/${selectedChat._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setChats(prev => prev.filter(chat => chat._id !== selectedChat._id));
      setSelectedChat(null);
    } catch (err) {
      setError('Failed to delete chat');
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const getAvatarText = (name) => {
    if (!name) return '??';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    return initials.substring(0, 2);
  };

  const getStatusText = (person) => {
    if (!person || typeof person !== 'object') return 'offline';
    if (!person.lastLogin) return 'offline';
    
    try {
      const lastLogin = new Date(person.lastLogin);
      const diff = (new Date() - lastLogin) / (1000 * 60 * 60); // hours
      
      if (diff < 0.5) return 'online';
      if (diff < 24) return `last seen ${Math.floor(diff)}h ago`;
      return 'offline';
    } catch {
      return 'offline';
    }
  };

  const getAvailableUsers = () => {
    return [...users, ...candidates].filter(u => u._id !== user._id);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
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
                    .filter(chat => !chat.isGroupChat)
                    .filter(chat => 
                      chat.chatName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      chat.participants?.some(p => 
                        p.name?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                    )
                    .map(chat => (
                      <ListGroup.Item
                        key={chat._id}
                        action
                        active={selectedChat?._id === chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className="d-flex align-items-center"
                      >
                        <div className="avatar me-3">
                          {getAvatarText(
                            chat.participants?.find(p => p._id !== user._id)?.name || '?'
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong>
                              {chat.participants?.find(p => p._id !== user._id)?.name || 'Chat'}
                            </strong>
                            <small className="text-muted">
                              {chat.latestMessage?.createdAt 
                                ? new Date(chat.latestMessage.createdAt).toLocaleTimeString() 
                                : ''}
                            </small>
                          </div>
                          <small className="text-muted">
                            {chat.latestMessage?.content || 'No messages yet'}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                </ListGroup>
              </Tab.Pane>

              <Tab.Pane eventKey="groups">
                <ListGroup variant="flush">
                  {chats
                    .filter(chat => chat.isGroupChat)
                    .filter(chat => 
                      chat.chatName?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(chat => (
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
                            {chat.latestMessage?.content || 'No messages yet'}
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
                  <div className={`avatar me-3 ${selectedChat.isGroupChat ? 'group-avatar' : ''}`}>
                    {getAvatarText(
                      selectedChat.isGroupChat 
                        ? selectedChat.chatName 
                        : selectedChat.participants?.find(p => p._id !== user._id)?.name
                    )}
                  </div>
                  <div>
                    <h5 className="mb-0">
                      {selectedChat.isGroupChat 
                        ? selectedChat.chatName 
                        : selectedChat.participants?.find(p => p._id !== user._id)?.name}
                    </h5>
                    <small className="text-muted">
                      {selectedChat.isGroupChat 
                        ? `${selectedChat.participants?.length || 0} members`
                        : getStatusText(selectedChat.participants?.find(p => p._id !== user._id))}
                    </small>
                  </div>
                </div>
                {selectedChat.isGroupChat && (
                  <div>
                    <Button variant="outline-secondary" size="sm" className="me-2">
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
                    <p className="text-muted">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message._id} 
                      className={`message mb-3 ${message.sender._id === user._id ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">{message.content}</div>
                        <div className="message-time">
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    placeholder={`Message ${selectedChat.isGroupChat ? selectedChat.chatName : selectedChat.participants?.find(p => p._id !== user._id)?.name}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  />
                  <Button 
                    variant="primary" 
                    className="ms-2"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Send'}
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
                <div className='flex gap-6'>
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
      <Modal show={showAddFriendModal} onHide={() => setShowAddFriendModal(false)}>
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
              .filter(person => 
                person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(person => (
                <ListGroup.Item
                  key={person._id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex align-items-center">
                    <div className={`avatar me-3 ${getStatusText(person).includes('online') ? 'online' : ''}`}>
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
                    disabled={chats.some(chat => 
                      !chat.isGroupChat && 
                      chat.participants?.some(p => p._id === person._id)
                    )}
                  >
                    {chats.some(chat => 
                      !chat.isGroupChat && 
                      chat.participants?.some(p => p._id === person._id)
                    ) ? 'Already connected' : 'Add'}
                  </Button>
                </ListGroup.Item>
              ))}
          </ListGroup>
        </Modal.Body>
      </Modal>

      {/* New Group Modal */}
      <Modal show={showNewGroupModal} onHide={() => setShowNewGroupModal(false)}>
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
              .filter(person => 
                person.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                person.email?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(person => (
                <Form.Check
                  key={person._id}
                  type="checkbox"
                  id={`group-member-${person._id}`}
                  label={`${person.name} (${person.email || person.personalMail})`}
                  checked={selectedUsers.includes(person._id)}
                  onChange={() => toggleUserSelection(person._id)}
                />
              ))}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewGroupModal(false)}>
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




// import Navbar from '../Navbar';
// import React, { useState, useEffect } from 'react';
// import './chat.css';
// import axios from 'axios';
// import { io } from 'socket.io-client';

// const socket = io('http://142.93.213.81:5001'); // Connect to backend

// const ChatPopup = ({ selectedEmployee, closeChat }) => {
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [loggedInUser, setLoggedInUser] = useState(null);
//   const isGroupChat = selectedEmployee?.name === 'Community Group';

//   // Fetch user data when the component loads
//   useEffect(() => {
//     const fetchUserData = async () => {
//       const token = localStorage.getItem("token");
//       try {
//         const response = await fetch("http://142.93.213.81:5001/users/me", {
//           method: "GET",
//           credentials: "include",
//           headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${token}`
//           },
//         });
//         if (!response.ok) {
//           throw new Error(`Failed to fetch user data. Status: ${response.status}`);
//         }
//         const data = await response.json();
//         setLoggedInUser(data.name || 'Unknown User');
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//       }
//     };
//     fetchUserData();
//   }, []);

//   // Fetch messages when the component loads
//   useEffect(() => {
//     if (!selectedEmployee || !loggedInUser) return;

//     const fetchMessages = async () => {
//       try {
//         const response = await axios.get('http://142.93.213.81:5001/api/messages', {
//           params: { recipient: isGroupChat ? 'group' : selectedEmployee.name }
//         });
//         if (response.status === 200 && Array.isArray(response.data)) {
//           setMessages(response.data);
//         } else {
//           console.error('Unexpected response format:', response);
//         }
//       } catch (error) {
//         console.error('Error fetching messages:', error.response ? error.response.data : error.message);
//       }
//     };
//     fetchMessages();

//     socket.on('newMessage', (message) => {
//       setMessages((prev) => [...prev, message]);
//     });

//     return () => {
//       socket.off('newMessage');
//     };
//   }, [selectedEmployee, loggedInUser]);

//   // Handle sending a new message
//   const sendMessage = async () => {
//     if (!newMessage.trim()) return; // Avoid sending empty messages

//     try {
//       const response = await axios.post('http://142.93.213.81:5001/api/messages', {
//         sender: loggedInUser,
//         recipient: selectedEmployee.name,
//         text: newMessage,
//         isGroup: isGroupChat,
//       });
//       setMessages([...messages, response.data]);
//       setNewMessage('');
//     } catch (error) {
//       console.error('Error sending message:', error.response ? error.response.data : error.message);
//     }
//   };

//   // Handle deleting a message
//   const deleteMessage = async (messageId) => {
//     try {
//       const response = await axios.delete(`http://142.93.213.81:5001/api/messages/${messageId}`);
//       setMessages(messages.filter((msg) => msg._id !== messageId));
//       console.log('Message deleted:', response.data);
//     } catch (error) {
//       console.error('Error deleting message:', error);
//     }
//   };

//   // Format timestamp to 12-hour format
//   const formatTimestamp = (timestamp) => {
//     const date = new Date(timestamp);

//     let hours = date.getHours();
//     let minutes = date.getMinutes();
//     const ampm = hours >= 12 ? 'PM' : 'AM';

//     // Convert hours from 24-hour format to 12-hour format
//     hours = hours % 12;
//     hours = hours ? hours : 12; // The hour '0' should be '12'
//     minutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero to minutes if < 10

//     return {
//       formattedTime: `${hours}:${minutes} ${ampm}`,
//       formattedDate: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
//     };
//   };

//   // Track the previous date to compare for new day
//   let prevDate = null;

//   return (
//     <div className="chat-popup-overlay">
//       <div className="chat-popup">
//         <div className="chat-section">
//           <div className="chat-header">
//             <img src={selectedEmployee.avatar} alt={selectedEmployee.name} className="chat-avatar" />
//             <span>{selectedEmployee.name}</span>
//             <button className="close-chat" onClick={closeChat}>×</button>
//           </div>

//           <div className="chat-body">
//             {messages.map((msg, index) => {
//               const { formattedTime, formattedDate } = formatTimestamp(msg.createdAt);
//               const isNewDay = prevDate !== formattedDate;
//               if (isNewDay) {
//                 prevDate = formattedDate;
//               }

//               return (
//                 <div key={index} className={`chat-container ${msg.sender === selectedEmployee.name ? 'outgoing-container' : 'incoming-container'}`}>
//                   {isNewDay && (
//                     <div className="date-divider">
//                       <span>{formattedDate}</span>
//                     </div>
//                   )}
//                   <div className={`chat-message ${msg.sender === selectedEmployee.name ? 'incoming' : 'outgoing'}`}>
//                     <span className="sender-name">{msg.sender}</span>
//                     <p>{msg.text}</p>
//                     <span className="timestamp">{formattedTime}</span>
//                     <button className="delete-btn" onClick={() => deleteMessage(msg._id)}>🗑️</button>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           <div className="chat-footer">
//             <input
//               type="text"
//               placeholder="Message..."
//               value={newMessage}
//               onChange={(e) => setNewMessage(e.target.value)}
//               className="chat-input"
//             />
//             <button className="send-btn" onClick={sendMessage}>➤</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Chat = () => {
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [showChat, setShowChat] = useState(false);

//   const employees = [
//     { id: '12345', name: 'Ajiri Immonvede', department: 'Sales', position: 'Sales Manager', avatar: '/api/placeholder/32/32' },
//     { id: '67890', name: 'Ali Almoallim', department: 'Finance', position: 'Financial Analyst', avatar: '/api/placeholder/32/32' },
//     { id: '54321', name: 'Maria Skgaftar', department: 'Operations', position: 'Operations Manager', avatar: '/api/placeholder/32/32' },
//     { id: '67891', name: 'Hopeland Adel', department: 'Sales', position: 'Sales Analyst', avatar: '/api/placeholder/32/32' },
//     { id: '67892', name: 'Shon Nilsson', department: 'Finance', position: 'Financial Analyst', avatar: '/api/placeholder/32/32' },
//     { id: '67893', name: 'Jack Nevada', department: 'IT', position: 'IT Coordinator', avatar: '/api/placeholder/32/32' },
//   ];

//   const openChat = (employee) => {
//     setSelectedEmployee(employee);
//     setShowChat(true);
//   };

//   const closeChat = () => {
//     setSelectedEmployee(null);
//     setShowChat(false);
//   };

//   return (
//     <div className="main-cont">
//       {/* <Navbar /> */}
//       <div className="employee-list-container">
//         <div className="search-bar">
//           <h2 className="title">Employee List</h2>
//           <div className="search-input-container">
//             <input type="search" placeholder="Quick Search..." className="search-input" />
//             <span className="search-icon">🔍</span>
//           </div>
//           <button className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600">
//             Community Group
//           </button>
//         </div>

//         <div className="employee-table-container">
//           <table className="employee-table">
//             <thead>
//               <tr>
//                 <th className="employee-head">Employee</th>
//                 <th>Employee ID</th>
//                 <th>Department</th>
//                 <th>Position</th>
//                 <th className="action-head">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {employees.map((employee) => (
//                 <tr key={employee.id}>
//                   <td className="employee-cell">
//                     <div className="employee-info">
//                       <img src={employee.avatar} alt={employee.name} className="employee-avatar" />
//                       <span>{employee.name}</span>
//                     </div>
//                   </td>
//                   <td>{employee.id}</td>
//                   <td>{employee.department}</td>
//                   <td>{employee.position}</td>
//                   <td className="action-cell">
//                     <button className="chat-btn" onClick={() => openChat(employee)}>Chat</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {selectedEmployee && (
//           <ChatPopup
//             selectedEmployee={selectedEmployee}
//             closeChat={closeChat}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default Chat;


// import React, { useState, useEffect } from 'react';
// import { Container, Row, Col, ListGroup, Form, Button, Badge, Modal, Tab, Nav } from 'react-bootstrap';
// import './chat.css'; // Custom CSS for additional styling

// const Chat = () => {
//   // State management
//   const [activeTab, setActiveTab] = useState('personal');
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [showNewGroupModal, setShowNewGroupModal] = useState(false);
//   const [groupName, setGroupName] = useState('');
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');

//   // Sample data
//   const users = [
//     { id: 1, name: 'John Doe', avatar: 'JD', status: 'online', lastSeen: '' },
//     { id: 2, name: 'Jane Smith', avatar: 'JS', status: 'offline', lastSeen: '2h ago' },
//     { id: 3, name: 'Mike Johnson', avatar: 'MJ', status: 'online', lastSeen: '' },
//     { id: 4, name: 'Sarah Williams', avatar: 'SW', status: 'away', lastSeen: '30m ago' },
//     { id: 5, name: 'David Brown', avatar: 'DB', status: 'online', lastSeen: '' },
//   ];

//   const groups = [
//     { id: 1, name: 'Development Team', avatar: 'DT', members: [1, 3, 5], unread: 3 },
//     { id: 2, name: 'Marketing Team', avatar: 'MT', members: [2, 4], unread: 0 },
//     { id: 3, name: 'Management', avatar: 'MG', members: [1, 2, 3, 4, 5], unread: 1 },
//   ];

//   // Load sample messages when a chat is selected
//   useEffect(() => {
//     if (selectedChat) {
//       const sampleMessages = [
//         { id: 1, sender: selectedChat.id === 'personal' ? 2 : 1, text: 'Hi there!', timestamp: '10:30 AM' },
//         { id: 2, sender: 1, text: 'Hello! How are you?', timestamp: '10:31 AM' },
//         { id: 3, sender: selectedChat.id === 'personal' ? 2 : 3, text: 'I\'m good, thanks for asking. How about you?', timestamp: '10:33 AM' },
//         { id: 4, sender: 1, text: 'Doing well! Just working on the new project.', timestamp: '10:35 AM' },
//         { id: 5, sender: selectedChat.id === 'personal' ? 2 : 4, text: 'That sounds interesting. Can we discuss it in our next meeting?', timestamp: '10:37 AM' },
//       ];
//       setMessages(sampleMessages);
//     }
//   }, [selectedChat]);

//   const handleSendMessage = () => {
//     if (newMessage.trim() && selectedChat) {
//       const newMsg = {
//         id: messages.length + 1,
//         sender: 1, // Assuming current user is sender
//         text: newMessage,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };
//       setMessages([...messages, newMsg]);
//       setNewMessage('');
//     }
//   };

//   const handleCreateGroup = () => {
//     if (groupName.trim() && selectedUsers.length > 0) {
//       // In a real app, you would send this to your backend
//       const newGroup = {
//         id: groups.length + 1,
//         name: groupName,
//         avatar: groupName.substring(0, 2).toUpperCase(),
//         members: selectedUsers,
//         unread: 0
//       };
//       // Add to groups list (in real app, this would be handled by backend)
//       groups.push(newGroup);
//       setShowNewGroupModal(false);
//       setGroupName('');
//       setSelectedUsers([]);
//     }
//   };

//   const toggleUserSelection = (userId) => {
//     if (selectedUsers.includes(userId)) {
//       setSelectedUsers(selectedUsers.filter(id => id !== userId));
//     } else {
//       setSelectedUsers([...selectedUsers, userId]);
//     }
//   };

//   return (
//     <Container fluid className="chat-container">
//       <Row className="h-100">
//         {/* Left sidebar - Chat list */}
//         <Col md={4} className="sidebar p-0 border-end">
//           <div className="sidebar-header p-3 border-bottom">
//             <h5>Office Chat</h5>
//             <Button 
//               variant="primary" 
//               size="sm" 
//               onClick={() => setShowNewGroupModal(true)}
//             >
//               New Group
//             </Button>
//           </div>

//           <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
//             <Nav variant="tabs" className="px-3 pt-2">
//               <Nav.Item>
//                 <Nav.Link eventKey="personal">Personal</Nav.Link>
//               </Nav.Item>
//               <Nav.Item>
//                 <Nav.Link eventKey="groups">Groups</Nav.Link>
//               </Nav.Item>
//             </Nav>

//             <Tab.Content className="p-2">
//               <Tab.Pane eventKey="personal">
//                 <Form.Control
//                   type="text"
//                   placeholder="Search colleagues..."
//                   className="mb-3"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <ListGroup variant="flush">
//                   {users
//                     .filter(user => 
//                       user.name.toLowerCase().includes(searchTerm.toLowerCase())
//                     )
//                     .map(user => (
//                       <ListGroup.Item
//                         key={user.id}
//                         action
//                         active={selectedChat?.id === user.id && selectedChat?.type === 'personal'}
//                         onClick={() => setSelectedChat({ id: user.id, type: 'personal', name: user.name })}
//                         className="d-flex align-items-center"
//                       >
//                         <div className={`avatar me-3 ${user.status}`}>
//                           {user.avatar}
//                         </div>
//                         <div className="flex-grow-1">
//                           <div className="d-flex justify-content-between">
//                             <strong>{user.name}</strong>
//                             <small className="text-muted">{user.lastSeen}</small>
//                           </div>
//                           <small className="text-muted">Last message preview...</small>
//                         </div>
//                         {user.unread > 0 && (
//                           <Badge pill bg="danger" className="ms-2">
//                             {user.unread}
//                           </Badge>
//                         )}
//                       </ListGroup.Item>
//                     ))}
//                 </ListGroup>
//               </Tab.Pane>

//               <Tab.Pane eventKey="groups">
//                 <ListGroup variant="flush">
//                   {groups.map(group => (
//                     <ListGroup.Item
//                       key={group.id}
//                       action
//                       active={selectedChat?.id === group.id && selectedChat?.type === 'group'}
//                       onClick={() => setSelectedChat({ id: group.id, type: 'group', name: group.name })}
//                       className="d-flex align-items-center"
//                     >
//                       <div className="avatar me-3 group-avatar">
//                         {group.avatar}
//                       </div>
//                       <div className="flex-grow-1">
//                         <div className="d-flex justify-content-between">
//                           <strong>{group.name}</strong>
//                           <small className="text-muted">{group.members.length} members</small>
//                         </div>
//                         <small className="text-muted">Last group message...</small>
//                       </div>
//                       {group.unread > 0 && (
//                         <Badge pill bg="danger" className="ms-2">
//                           {group.unread}
//                         </Badge>
//                       )}
//                     </ListGroup.Item>
//                   ))}
//                 </ListGroup>
//               </Tab.Pane>
//             </Tab.Content>
//           </Tab.Container>
//         </Col>

//         {/* Right side - Chat area */}
//         <Col md={8} className="chat-area p-0 d-flex flex-column">
//           {selectedChat ? (
//             <>
//               <div className="chat-header p-3 border-bottom d-flex align-items-center">
//                 <div className={`avatar me-3 ${selectedChat.type === 'group' ? 'group-avatar' : ''}`}>
//                   {selectedChat.type === 'group' 
//                     ? selectedChat.name.substring(0, 2).toUpperCase()
//                     : selectedChat.name.substring(0, 2).toUpperCase()}
//                 </div>
//                 <div>
//                   <h5 className="mb-0">{selectedChat.name}</h5>
//                   <small className="text-muted">
//                     {selectedChat.type === 'group' 
//                       ? `${groups.find(g => g.id === selectedChat.id)?.members.length || 0} members`
//                       : users.find(u => u.id === selectedChat.id)?.status || 'offline'}
//                   </small>
//                 </div>
//               </div>

//               <div className="messages-container flex-grow-1 p-3">
//                 {messages.map(message => (
//                   <div 
//                     key={message.id} 
//                     className={`message mb-3 ${message.sender === 1 ? 'sent' : 'received'}`}
//                   >
//                     <div className="message-content">
//                       <div className="message-text">{message.text}</div>
//                       <div className="message-time">{message.timestamp}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="message-input p-3 border-top">
//                 <Form.Group className="d-flex">
//                   <Form.Control
//                     as="textarea"
//                     rows={1}
//                     placeholder={`Message ${selectedChat.name}`}
//                     value={newMessage}
//                     onChange={(e) => setNewMessage(e.target.value)}
//                     onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
//                   />
//                   <Button 
//                     variant="primary" 
//                     className="ms-2"
//                     onClick={handleSendMessage}
//                     disabled={!newMessage.trim()}
//                   >
//                     Send
//                   </Button>
//                 </Form.Group>
//               </div>
//             </>
//           ) : (
//             <div className="d-flex flex-column align-items-center justify-content-center h-100">
//               <div className="text-center p-5">
//                 <h4>Welcome to Office Chat</h4>
//                 <p className="text-muted">
//                   Select a conversation or create a new group to start chatting
//                 </p>
//                 <Button 
//                   variant="primary" 
//                   onClick={() => setShowNewGroupModal(true)}
//                 >
//                   Create New Group
//                 </Button>
//               </div>
//             </div>
//           )}
//         </Col>
//       </Row>

//       {/* New Group Modal */}
//       <Modal show={showNewGroupModal} onHide={() => setShowNewGroupModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Create New Group</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form.Group className="mb-3">
//             <Form.Label>Group Name</Form.Label>
//             <Form.Control
//               type="text"
//               placeholder="Enter group name"
//               value={groupName}
//               onChange={(e) => setGroupName(e.target.value)}
//             />
//           </Form.Group>
//           <Form.Group>
//             <Form.Label>Add Members</Form.Label>
//             {users.map(user => (
//               <Form.Check
//                 key={user.id}
//                 type="checkbox"
//                 id={`user-${user.id}`}
//                 label={user.name}
//                 checked={selectedUsers.includes(user.id)}
//                 onChange={() => toggleUserSelection(user.id)}
//               />
//             ))}
//           </Form.Group>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowNewGroupModal(false)}>
//             Cancel
//           </Button>
//           <Button 
//             variant="primary" 
//             onClick={handleCreateGroup}
//             disabled={!groupName.trim() || selectedUsers.length === 0}
//           >
//             Create Group
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default Chat;

// import React, { useState, useEffect } from 'react';
// import { Container, Row, Col, ListGroup, Form, Button, Badge, Modal, Tab, Nav, Spinner, Alert } from 'react-bootstrap';
// import axios from 'axios';
// import './chat.css';
// import { useAuth } from '../AuthProvider/AuthContext'; // Assuming you have an auth context


// const Chat = () => {
//   const { user } = useAuth();
//   const [activeTab, setActiveTab] = useState('personal');
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [selectedChat, setSelectedChat] = useState(null);
//   const [showNewGroupModal, setShowNewGroupModal] = useState(false);
//   const [showAddFriendModal, setShowAddFriendModal] = useState(false);
//   const [groupName, setGroupName] = useState('');
//   const [groups, setGroups] = useState([]);
//   const [selectedUsers, setSelectedUsers] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [users, setUsers] = useState([]);
//   const [candidates, setCandidates] = useState([]);
//   const [connections, setConnections] = useState([]); // Track user connections

//   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://142.93.213.81:5001';

//   // Fetch initial data (users and candidates)
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
        
//         // Fetch users (excluding super admins)
//         const usersRes = await axios.get(`${API_BASE_URL}/users`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//         });
//         const regularUsers = usersRes.data.filter(u => u.role !== 'Super_Admin');
//         setUsers(regularUsers);

//         // Fetch candidates
//         const candidatesRes = await axios.get(`${API_BASE_URL}/api/candidates`, {
//           headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//         });
//         setCandidates(candidatesRes.data.data);

//         // For demo purposes - initialize with empty connections
//         setConnections([]);
        
//       } catch (err) {
//         console.error('Error fetching data:', err);
//         setError('Failed to load users and candidates');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Handle sending a message (simulated for demo)
//   const handleSendMessage = () => {
//     if (newMessage.trim() && selectedChat) {
//       const newMsg = {
//         id: messages.length + 1,
//         sender: user._id,
//         text: newMessage,
//         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
//       };
//       setMessages([...messages, newMsg]);
//       setNewMessage('');
//     }
//   };

//   // Handle adding a friend/connection
//   const handleAddFriend = async (userId) => {
//     try {
//       setLoading(true);
//       // In a real app, you would make an API call here to establish connection
//       // For demo, we'll just add to local state
//       if (!connections.includes(userId)) {
//         setConnections([...connections, userId]);
//       }
//       setShowAddFriendModal(false);
//     } catch (err) {
//       setError('Failed to add connection');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Get avatar text from name
//   const getAvatarText = (name) => {
//     if (!name) return '';
//     return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
//   };

//   // Get status text
//   const getStatusText = (person) => {
//     if (!person.lastLogin) return 'offline';
//     const lastLogin = new Date(person.lastLogin);
//     const diff = (new Date() - lastLogin) / (1000 * 60 * 60); // hours
    
//     if (diff < 0.5) return 'online';
//     if (diff < 24) return `last seen ${Math.floor(diff)}h ago`;
//     return 'offline';
//   };

// // Moved toggleUserSelection function before its usage
// const toggleUserSelection = (userId) => {
//   if (selectedUsers.includes(userId)) {
//     setSelectedUsers(selectedUsers.filter(id => id !== userId));
//   } else {
//     setSelectedUsers([...selectedUsers, userId]);
//   }
// };


//   // Combine users and candidates for display
//   const getAvailableConnections = () => {
//     return [
//       ...users.filter(u => u._id !== user._id),
//       ...candidates
//     ].filter(person => !connections.includes(person._id));
//   };

//   if (loading) {
//     return (
//       <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
//         <Spinner animation="border" variant="primary" />
//       </Container>
//     );
//   }

//   if (error) {
//     return (
//       <Container className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
//         <Alert variant="danger" onClose={() => setError(null)} dismissible>
//           {error}
//         </Alert>
//       </Container>
//     );
//   }

//   return (
//     <Container fluid className="chat-container">
//       <Row className="h-100">
//         {/* Left sidebar - Connections list */}
//         <Col md={4} className=" p-0 border-end">
//           <div className="sidebar-header p-3 border-bottom d-flex justify-content-between align-items-center">
//             <h5>Office Chat</h5>
//             <div>
//               <Button 
//                 variant="primary" 
//                 size="sm" 
//                 onClick={() => setShowAddFriendModal(true)}
//                 className="me-2"
//               >
//                 Add Friend
//               </Button>
//               <Button 
//                 variant="secondary" 
//                 size="sm" 
//                 onClick={() => setShowNewGroupModal(true)}
//               >
//                 New Group
//               </Button>
//             </div>
//           </div>

//           <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
//             <Nav variant="tabs" className="px-3 pt-2">
//               <Nav.Item>
//                 <Nav.Link eventKey="personal">Connections</Nav.Link>
//               </Nav.Item>
//               <Nav.Item>
//                 <Nav.Link eventKey="groups">Groups</Nav.Link>
//               </Nav.Item>
//             </Nav>

//             <Tab.Content className="p-2">
//               <Tab.Pane eventKey="personal">
//                 <Form.Control
//                   type="text"
//                   placeholder="Search connections..."
//                   className="mb-3"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//                 <ListGroup variant="flush">
//                   {connections.length === 0 ? (
//                     <ListGroup.Item className="text-muted">
//                       No connections yet. Click "Add Friend" to start chatting.
//                     </ListGroup.Item>
//                   ) : (
//                     [...users, ...candidates]
//                       .filter(person => 
//                         connections.includes(person._id) &&
//                         person.name?.toLowerCase().includes(searchTerm.toLowerCase())
//                       )
//                       .map(person => (
//                         <ListGroup.Item
//                           key={person._id}
//                           action
//                           active={selectedChat?._id === person._id}
//                           onClick={() => setSelectedChat({
//                             _id: person._id,
//                             name: person.name,
//                             type: 'personal'
//                           })}
//                           className="d-flex align-items-center"
//                         >
//                           <div className={`avatar me-3 ${getStatusText(person).includes('online') ? 'online' : ''}`}>
//                             {getAvatarText(person.name)}
//                           </div>
//                           <div className="flex-grow-1">
//                             <div className="d-flex justify-content-between">
//                               <strong>{person.name}</strong>
//                               <small className="text-muted">{getStatusText(person)}</small>
//                             </div>
//                             <small className="text-muted">{person.email || person.personalMail}</small>
//                           </div>
//                         </ListGroup.Item>
//                       ))
//                   )}
//                 </ListGroup>
//               </Tab.Pane>

//               <Tab.Pane eventKey="groups">
//                 <ListGroup variant="flush">
//                   {groups.length === 0 ? (
//                     <ListGroup.Item className="text-muted">
//                       No groups yet. Create one to start group chatting.
//                     </ListGroup.Item>
//                   ) : (
//                     groups.map(group => (
//                       <ListGroup.Item
//                         key={group._id}
//                         action
//                         active={selectedChat?._id === group._id}
//                         onClick={() => setSelectedChat(group)}
//                         className="d-flex align-items-center"
//                       >
//                         <div className="avatar me-3 group-avatar">
//                           {getAvatarText(group.name)}
//                         </div>
//                         <div className="flex-grow-1">
//                           <div className="d-flex justify-content-between">
//                             <strong>{group.name}</strong>
//                             <small className="text-muted">{group.members?.length || 0} members</small>
//                           </div>
//                         </div>
//                       </ListGroup.Item>
//                     ))
//                   )}
//                 </ListGroup>
//               </Tab.Pane>
//             </Tab.Content>
//           </Tab.Container>
//         </Col>

//         {/* Right side - Chat area */}
//         <Col md={8} className="chat-area p-0 d-flex flex-column">
//           {selectedChat ? (
//             <>
//               <div className="chat-header p-3 border-bottom d-flex align-items-center">
//                 <div className={`avatar me-3 ${selectedChat.type === 'group' ? 'group-avatar' : ''}`}>
//                   {getAvatarText(selectedChat.name)}
//                 </div>
//                 <div>
//                   <h5 className="mb-0">{selectedChat.name}</h5>
//                   <small className="text-muted">
//                     {selectedChat.type === 'group' 
//                       ? `${selectedChat.members?.length || 0} members`
//                       : getStatusText([...users, ...candidates].find(p => p._id === selectedChat._id))}
//                   </small>
//                 </div>
//               </div>

//               <div className="messages-container flex-grow-1 p-3">
//                 {messages.length === 0 ? (
//                   <div className="d-flex justify-content-center align-items-center h-100">
//                     <p className="text-muted">No messages yet. Start the conversation!</p>
//                   </div>
//                 ) : (
//                   messages.map(message => (
//                     <div 
//                       key={message.id} 
//                       className={`message mb-3 ${message.sender === user._id ? 'sent' : 'received'}`}
//                     >
//                       <div className="message-content">
//                         <div className="message-text">{message.text}</div>
//                         <div className="message-time">{message.timestamp}</div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>

//               <div className="message-input p-3 border-top">
//                 <Form.Group className="d-flex">
//                   <Form.Control
//                     as="textarea"
//                     rows={1}
//                     placeholder={`Message ${selectedChat.name}`}
//                     value={newMessage}
//                     onChange={(e) => setNewMessage(e.target.value)}
//                     onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
//                   />
//                   <Button 
//                     variant="primary" 
//                     className="ms-2"
//                     onClick={handleSendMessage}
//                     disabled={!newMessage.trim()}
//                   >
//                     Send
//                   </Button>
//                 </Form.Group>
//               </div>
//             </>
//           ) : (
//             <div className="d-flex flex-column align-items-center justify-content-center h-100">
//               <div className="text-center p-5">
//                 <h4>Welcome to Office Chat</h4>
//                 <p className="text-muted">
//                   {connections.length === 0 
//                     ? "Add connections to start chatting" 
//                     : "Select a conversation to start chatting"}
//                 </p>
//                 <Button 
//                   variant="primary" 
//                   onClick={() => setShowAddFriendModal(true)}
//                 >
//                   Add Friend
//                 </Button>
//               </div>
//             </div>
//           )}
//         </Col>
//       </Row>

//       {/* Add Friend Modal */}
//       <Modal show={showAddFriendModal} onHide={() => setShowAddFriendModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Add New Connection</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form.Control
//             type="text"
//             placeholder="Search people..."
//             className="mb-3"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <ListGroup variant="flush">
//             {getAvailableConnections()
//               .filter(person => 
//                 person.name?.toLowerCase().includes(searchTerm.toLowerCase())
//               )
//               .map(person => (
//                 <ListGroup.Item
//                   key={person._id}
//                   className="d-flex justify-content-between align-items-center"
//                 >
//                   <div className="d-flex align-items-center">
//                     <div className={`avatar me-3 ${getStatusText(person).includes('online') ? 'online' : ''}`}>
//                       {getAvatarText(person.name)}
//                     </div>
//                     <div>
//                       <strong>{person.name}</strong>
//                       <div className="text-muted small">
//                         {person.email || person.personalMail}
//                       </div>
//                     </div>
//                   </div>
//                   <Button 
//                     variant="outline-primary" 
//                     size="sm"
//                     onClick={() => handleAddFriend(person._id)}
//                   >
//                     Add
//                   </Button>
//                 </ListGroup.Item>
//               ))}
//           </ListGroup>
//         </Modal.Body>
//       </Modal>

//       {/* New Group Modal */}
//       <Modal show={showNewGroupModal} onHide={() => setShowNewGroupModal(false)}>
//         <Modal.Header closeButton>
//           <Modal.Title>Create New Group</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form.Group className="mb-3">
//             <Form.Label>Group Name</Form.Label>
//             <Form.Control
//               type="text"
//               placeholder="Enter group name"
//               value={groupName}
//               onChange={(e) => setGroupName(e.target.value)}
//             />
//           </Form.Group>
//           <Form.Group>
//             <Form.Label>Add Members</Form.Label>
//             {connections.map(connectionId => {
//               const person = [...users, ...candidates].find(p => p._id === connectionId);
//               return person ? (
//                 <Form.Check
//                   key={person._id}
//                   type="checkbox"
//                   id={`group-member-${person._id}`}
//                   label={`${person.name} (${person.type || 'User'})`}
//                   checked={selectedUsers.includes(person._id)}
//                   onChange={() => toggleUserSelection(person._id)}
//                 />
//               ) : null;
//             })}
//           </Form.Group>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setShowNewGroupModal(false)}>
//             Cancel
//           </Button>
//           <Button 
//             variant="primary" 
//             onClick={() => {
//               // For demo, just create a local group
//               const newGroup = {
//                 _id: `group-${Date.now()}`,
//                 name: groupName,
//                 members: selectedUsers,
//                 type: 'group'
//               };
//               setGroups([...groups, newGroup]);
//               setShowNewGroupModal(false);
//               setSelectedChat(newGroup);
//               setGroupName('');
//               setSelectedUsers([]);
//             }}
//             disabled={!groupName.trim() || selectedUsers.length === 0}
//           >
//             Create Group
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </Container>
//   );
// };

// export default Chat;