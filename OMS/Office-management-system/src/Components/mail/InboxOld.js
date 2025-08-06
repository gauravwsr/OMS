import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil, Mail, Send, FileText, Settings, Refresh } from "lucide-react";
import Navbar from "../Navbar";
import { useNavigate } from 'react-router-dom';
import "./Inbox.css";
import SearchBar from "../Search-bar/SearchBar";
import InboxSection from './InboxSection';
import SentSection from './SentSection';
import DraftSection from './DraftSection';
import SendEmail from './SendEmail';
import EmailLogin from './EmailLogin';

const Inbox = () => {
  const [sentEmails, setSentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [activeTab, setActiveTab] = useState("inbox");
  const [error, setError] = useState(null);
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [emailConfig, setEmailConfig] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Check if email is configured on component mount
  useEffect(() => {
    checkEmailConfiguration();
  }, []);

  // Fetch emails when tab changes or email is configured
  useEffect(() => {
    if (isConfigured) {
      fetchEmails();
    }
  }, [activeTab, isConfigured]);

  const checkEmailConfiguration = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch('http://localhost:5001/api/emails/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEmailConfig(data.data);
        setIsConfigured(true);
      } else {
        setIsConfigured(false);
      }
    } catch (error) {
      console.error('Error checking email configuration:', error);
      setIsConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      let url = '';
      
      if (activeTab === 'inbox') {
        url = 'http://localhost:5001/api/emails?type=received';
      } else if (activeTab === 'sent') {
        url = 'http://localhost:5001/api/emails?type=sent';
      } else if (activeTab === 'drafts') {
        url = 'http://localhost:5001/api/emails/drafts';
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch emails');
      }

      if (activeTab === 'inbox') {
        setEmails(data.data?.emails || []);
        setFilteredEmails(data.data?.emails || []);
      } else if (activeTab === 'sent') {
        setSentEmails(data.data?.emails || []);
      } else if (activeTab === 'drafts') {
        setDrafts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshEmails = async () => {
    if (!isConfigured) return;
    
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      const password = prompt('Enter your email password to sync with server:');
      
      if (!password) {
        setRefreshing(false);
        return;
      }

      const res = await fetch(`http://localhost:5001/api/emails/fetch?passwordCheck=${encodeURIComponent(password)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch emails from server');
      }

      alert(`Successfully synced ${data.data?.newEmailsCount || 0} new emails`);
      await fetchEmails(); // Refresh the current view
    } catch (error) {
      console.error('Error refreshing emails:', error);
      alert('Error refreshing emails: ' + error.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (activeTab === 'inbox') {
      const filtered = emails.filter(email =>
        email.subject?.toLowerCase().includes(term.toLowerCase()) ||
        email.from?.toLowerCase().includes(term.toLowerCase()) ||
        email.textContent?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredEmails(filtered);
    }
  };

  const handleSort = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);
    
    if (activeTab === 'inbox') {
      const sorted = [...filteredEmails].sort((a, b) => {
        const dateA = new Date(a.sentDate || a.receivedDate);
        const dateB = new Date(b.sentDate || b.receivedDate);
        return newOrder === "asc" ? dateA - dateB : dateB - dateA;
      });
      setFilteredEmails(sorted);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  const onEmailConfigured = () => {
    setIsConfigured(true);
    setShowEmailLogin(false);
    checkEmailConfiguration();
    fetchEmails();
  };

  if (!isConfigured && !loading) {
    return (
      <div className="email-container">
        <Navbar />
        <div className="email-setup-container">
          <div className="email-setup-card">
            <Mail size={64} className="email-setup-icon" />
            <h2>Configure Your Email</h2>
            <p>To use the mailbox feature, please configure your Hostinger email credentials.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowEmailLogin(true)}
            >
              Configure Email
            </button>
          </div>
        </div>
        {showEmailLogin && (
          <EmailLogin 
            onClose={() => setShowEmailLogin(false)}
            onConfigured={onEmailConfigured}
          />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="email-container">
        <Navbar />
        <div className="email-loading">
          <div className="loading-spinner"></div>
          <p>Loading mailbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="email-container">
      <Navbar />
      <div className="email-wrapper">
        <div className="email-sidebar">
          <div className="email-header">
            <h2>Mailbox</h2>
            <div className="email-actions">
              <button
                className="btn btn-primary compose-btn"
                onClick={() => setShowCompose(true)}
              >
                <Pencil size={16} />
                Compose
              </button>
              <button
                className="btn btn-secondary refresh-btn"
                onClick={refreshEmails}
                disabled={refreshing}
              >
                <Refresh size={16} className={refreshing ? 'spinning' : ''} />
                {refreshing ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>

          <div className="email-config-info">
            <p><strong>Email:</strong> {emailConfig?.email}</p>
            <button 
              className="btn btn-link"
              onClick={() => setShowEmailLogin(true)}
            >
              <Settings size={14} />
              Settings
            </button>
          </div>

          <div className="email-tabs">
            <button
              className={`tab-btn ${activeTab === "inbox" ? "active" : ""}`}
              onClick={() => handleTabChange("inbox")}
            >
              <Mail size={16} />
              Inbox ({emails.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "sent" ? "active" : ""}`}
              onClick={() => handleTabChange("sent")}
            >
              <Send size={16} />
              Sent ({sentEmails.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "drafts" ? "active" : ""}`}
              onClick={() => handleTabChange("drafts")}
            >
              <FileText size={16} />
              Drafts ({drafts.length})
            </button>
          </div>
        </div>

        <div className="email-content">
          <div className="email-toolbar">
            <SearchBar onSearch={handleSearch} placeholder="Search emails..." />
            <button className="btn btn-secondary" onClick={handleSort}>
              Sort by Date ({sortOrder === "asc" ? "Oldest" : "Newest"} first)
            </button>
          </div>

          {error && (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          <div className="email-list-container">
            {activeTab === "inbox" && (
              <InboxSection
                emails={filteredEmails}
                loading={loading}
                onRefresh={fetchEmails}
              />
            )}
            {activeTab === "sent" && (
              <SentSection
                emails={sentEmails}
                loading={loading}
                onRefresh={fetchEmails}
              />
            )}
            {activeTab === "drafts" && (
              <DraftSection
                drafts={drafts}
                loading={loading}
                onRefresh={fetchEmails}
                onCompose={() => setShowCompose(true)}
              />
            )}
          </div>
        </div>
      </div>

      {showCompose && (
        <SendEmail
          onClose={() => setShowCompose(false)}
          onEmailSent={() => {
            setShowCompose(false);
            if (activeTab === "sent") fetchEmails();
          }}
        />
      )}

      {showEmailLogin && (
        <EmailLogin
          onClose={() => setShowEmailLogin(false)}
          onConfigured={onEmailConfigured}
          existingConfig={emailConfig}
        />
      )}
    </div>
  );
};

export default Inbox;
//         } else if (activeTab === 'drafts') {
//           setDrafts(data || []);
//         }
//       } catch (err) {
//         console.error(`Error fetching ${activeTab} emails:, err`);
//         setError(`Failed to fetch ${activeTab} emails`);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEmails();
//   }, [activeTab]);


//   useEffect(() => {
//     const filterEmails = (searchTerm) => {
//       if (typeof searchTerm !== "string") {
//         searchTerm = ""; // Ensure searchTerm is always a string
//       }
//       const filtered = (emails || []).filter((email) =>
//         (email.sender?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//         (email.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//         (email.content?.toLowerCase() || "").includes(searchTerm.toLowerCase())
//       );
//       setFilteredEmails(filtered);
//     };

//     if (activeTab === "inbox") {
//       setFilteredEmails(filterEmails(emails));
//     } else if (activeTab === "sent") {
//       setFilteredEmails(filterEmails(sentEmails));
//     } else if (activeTab === "drafts") {
//       setFilteredEmails(filterEmails(drafts));
//     }
//   }, [searchTerm, emails, sentEmails, drafts, activeTab]);

//   const handleTabClick = (tab) => {
//     setActiveTab(tab); // Set active tab when clicked
//   };

//   // Navigate to compose email page
//   const handleComposeClick = () => {
//     navigate('send-email');
//   };

//   const handleSortByDate = () => {
//     setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));

//     const sortEmails = (emails) => {
//       return [...emails].sort((a, b) => {
//         const dateA = new Date(a.date);
//         const dateB = new Date(b.date);
//         return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
//       });
//     };

//     if (activeTab === "inbox") {
//       setEmails(sortEmails(emails));
//     } else if (activeTab === "sent") {
//       setSentEmails(sortEmails(sentEmails));
//     } else if (activeTab === "drafts") {
//       setDrafts(sortEmails(drafts));
//     }
//   };

//   const handlePreviousDay = () => {
//     setCurrentDate((prevDate) => {
//       const newDate = new Date(prevDate);
//       newDate.setDate(newDate.getDate() - 1);
//       return newDate;
//     });
//   };

//   const handleNextDay = () => {
//     setCurrentDate((prevDate) => {
//       const newDate = new Date(prevDate);
//       const today = new Date();
//       if (newDate < today) {
//         newDate.setDate(newDate.getDate() + 1);
//       }
//       return newDate;
//     });
//   };

//   return (
//     <div className="main-cont">
//       {/* <Navbar /> */}
//       <div className="meetings-container" style={{ width: "80%" }}>
//         {/* Header */}
//         <SearchBar setSearchTerm={setSearchTerm} />
//         <div className="meetings-header">
//           <div className="tabs">
//             <button className={`tab-button ${activeTab === "Inbox" ? "active" : ""}`} onClick={() => handleTabClick('inbox')}>Inbox</button>
//             <button className={`tab-button ${activeTab === "Inbox" ? "active" : ""}`} onClick={() => handleTabClick('sent')}>Sent</button>
//             <button className={`tab-button ${activeTab === "Inbox" ? "active" : ""}`} onClick={() => handleTabClick('drafts')}>Drafts</button>
//           </div>

//           <button className="compose-button" onClick={handleComposeClick}>
//             <Pencil className="icon" />
//             Compose
//           </button>
//         </div>

//         {/* Date Navigation */}
//         <div className="date-nav">
//           <div className="date-nav-content">
//             <h2 className="date-title">E-MAILS</h2>
//             <div className="date-controls">
//             <button className="nav-button" onClick={handlePreviousDay}>
//                 <ChevronLeft className="icon" />
//               </button>
//               <span className="current-date" onClick={handleSortByDate} style={{ cursor: 'pointer' }}>
//                 {currentDate.toDateString()}
//               </span>
//               <button className="nav-button" onClick={handleNextDay}>
//                 <ChevronRight className="icon" />
//               </button>
//             </div>
//           </div>
//         </div>
//         {/* Meetings List */}
//         <div className="meetings-list">
//           <div className="meetings-header-row">
//             <div>Sender</div>
//             <div>Subject</div>
//             <div>Time</div>
//           </div>

//           <main className="email-main">
//             <h1>
//               {activeTab === 'inbox'
//                 ? 'Inbox'
//                 : activeTab === 'sent'
//                   ? 'Sent Emails'
//                   : 'Draft Emails'}
//             </h1>

//             {loading ? (
//               <p>Loading...</p>
//             ) : error ? (
//               <p style={{ color: 'red' }}>{error}</p>
//             ) : activeTab === 'inbox' ? (
//               <InboxSection emails={(filteredEmails && filteredEmails.length > 0) ? filteredEmails : emails || []} />
//             ) : activeTab === 'sent' ? (
//               <SentSection emails={sentEmails} />
export default Inbox;