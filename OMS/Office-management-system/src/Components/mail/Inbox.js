<<<<<<< HEAD
// import { useState, useEffect } from "react";
// import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
// import Navbar from "../Navbar";
// import { useNavigate } from 'react-router-dom';
// import "./Inbox.css";
// import SearchBar from "../Search-bar/SearchBar";
// import InboxSection from './InboxSection';
// import SentSection from './SentSection';
// import Drafts from './DraftSection';

// const Inbox = () => {
//   const [sentEmails, setSentEmails] = useState([]); // Sent emails
//   const [loading, setLoading] = useState(true);
//   const [drafts, setDrafts] = useState([]); // Draft emails
//   const [activeTab, setActiveTab] = useState("Inbox"); // Default tab is "Inbox"
//   const [error, setError] = useState(null);
//   const [emails, setEmails] = useState([]);
//   const [filteredEmails, setFilteredEmails] = useState([]);
//   const [sortOrder, setSortOrder] = useState("asc");
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [searchTerm, setSearchTerm] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchEmails = async () => {
//       setLoading(true);
//       setError(null);

//       let url = '';
//       if (activeTab === 'inbox') {
//         url = 'http://localhost:5001/fetch-inbox-emails';
//         url = 'http://localhost:5001/fetch-inbox-emails';
//       } else if (activeTab === 'sent') {
//         url = 'http://localhost:5001/fetch-sent-emails';
//         url = 'http://localhost:5001/fetch-sent-emails';
//       } else if (activeTab === 'drafts') {
//         url = 'http://localhost:5001/fetch-drafts';
//         url = 'http://localhost:5001/fetch-drafts';
//       }

//       try {
//         const res = await fetch(url);
//         const data = await res.json();

//         if (!res.ok) {
//           throw new Error(data.message || 'Failed to fetch data');
//         }

//         if (activeTab === 'inbox') {
//           setEmails(data.emails || []);
//         } else if (activeTab === 'sent') {
//           setSentEmails(data.emails || []);
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
//             ) : (
//               <Drafts drafts={drafts} />
//             )}
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Inbox;

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import SearchBar from "../Search-bar/SearchBar";
import InboxSection from "./InboxSection";
import SentSection from "./SentSection";
import DraftSection from "./DraftSection";
import "./Inbox.css";
=======
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil, Settings } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthContext';
import SearchBar from "../Search-bar/SearchBar";
import InboxSection from './InboxSection';
import SentSection from './SentSection';
import DraftSection from './DraftSection';
import EmailConfig from './EmailConfig';
import './Inbox.css';
>>>>>>> f352f76c519260eac44ee5a784da470c43b78238

const Inbox = () => {
  const { user } = useAuth();
  const [sentEmails, setSentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [activeTab, setActiveTab] = useState("inbox");
  const [error, setError] = useState(null);
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmailConfigured, setIsEmailConfigured] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkEmailConfiguration();
  }, []);

<<<<<<< HEAD
      let url = "";
      if (activeTab === "inbox") {
        url = "http://localhost:5001/fetch-inbox-emails";
      } else if (activeTab === "sent") {
        url = "http://localhost:5001/fetch-sent-emails";
      } else if (activeTab === "drafts") {
        url = "http://localhost:5001/fetch-drafts";
      }

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch data");
=======
  const checkEmailConfiguration = async () => {
    setCheckingConfig(true);
    try {
      const response = await fetch('http://localhost:5001/api/emails/check-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
>>>>>>> f352f76c519260eac44ee5a784da470c43b78238
        }
      });

<<<<<<< HEAD
        if (activeTab === "inbox") {
          setEmails(data.emails || []);
          setFilteredEmails(data.emails || []);
        } else if (activeTab === "sent") {
          setSentEmails(data.emails || []);
        } else if (activeTab === "drafts") {
          setDrafts(data || []);
        }
      } catch (err) {
        console.error(`Error fetching ${activeTab} emails:`, err);
        setError(`Failed to fetch ${activeTab} emails`);
      } finally {
        setLoading(false);
=======
      const data = await response.json();
      if (response.ok && data.configured) {
        setIsEmailConfigured(true);
>>>>>>> f352f76c519260eac44ee5a784da470c43b78238
      }
    } catch (error) {
      console.error('Error checking email configuration:', error);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleEmailConfigured = () => {
    setIsEmailConfigured(true);
    // Refresh the email configuration check and reload emails
    setTimeout(() => {
      checkEmailConfiguration();
      if (isEmailConfigured) {
        fetchEmails();
      }
    }, 500);
  };

  const handleEditConfig = () => {
    navigate('../email-config');
  };

  useEffect(() => {
    if (isEmailConfigured) {
      fetchEmails();
    }
  }, [activeTab, isEmailConfigured]);

  useEffect(() => {
    const filterEmails = () => {
      if (typeof searchTerm !== "string" || searchTerm === "") {
        return activeTab === "inbox"
          ? emails
          : activeTab === "sent"
          ? sentEmails
          : drafts;
      }

      const sourceEmails =
        activeTab === "inbox"
          ? emails
          : activeTab === "sent"
          ? sentEmails
          : drafts;

      return (sourceEmails || []).filter(
        (email) =>
          (email.sender?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (email.recipient?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (email.to?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (email.subject?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (email.content?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (email.body?.toLowerCase() || "").includes(searchTerm.toLowerCase())
      );
    };

    setFilteredEmails(filterEmails());
  }, [searchTerm, emails, sentEmails, drafts, activeTab]);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    let url = '';
    if (activeTab === 'inbox') {
      url = 'http://localhost:5001/api/emails/inbox';
    } else if (activeTab === 'sent') {
      url = 'http://localhost:5001/api/emails/sent';
    } else if (activeTab === 'drafts') {
      url = 'http://localhost:5001/api/emails/drafts';
    }

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch data');
      }

      if (activeTab === 'inbox') {
        setEmails(data.emails || []);
        setFilteredEmails(data.emails || []);
      } else if (activeTab === 'sent') {
        setSentEmails(data.emails || []);
      } else if (activeTab === 'drafts') {
        setDrafts(data.emails || data || []);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab} emails:`, err);
      // More specific error handling
      if (err.message.includes('Email not configured')) {
        setIsEmailConfigured(false);
        setError('Please configure your email settings first');
      } else if (err.message.includes('timeout') || err.message.includes('IMAP')) {
        setError(`Connection timeout. Please check your internet connection and email server settings.`);
      } else {
        setError(`Failed to fetch ${activeTab} emails: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show email configuration if not configured
  if (checkingConfig) {
    return (
      <div className="meetings-container">
        <div className="loading-message">Checking email configuration...</div>
      </div>
    );
  }

  // Show full page config if email is not configured
  if (!isEmailConfigured) {
    return (
      <div className="meetings-container">
        <EmailConfig onConfigured={handleEmailConfigured} />
      </div>
    );
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleComposeClick = () => {
    navigate("send-email");
  };

  const handleSortByDate = () => {
    setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));

    const sortEmails = (emails) => {
      return [...emails].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
      });
    };

    if (activeTab === "inbox") {
      setFilteredEmails(sortEmails(filteredEmails));
    } else if (activeTab === "sent") {
      setSentEmails(sortEmails(sentEmails));
    } else if (activeTab === "drafts") {
      setDrafts(sortEmails(drafts));
    }
  };

  const handlePreviousDay = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      const today = new Date();
      if (newDate < today) {
        newDate.setDate(newDate.getDate() + 1);
      }
      return newDate;
    });
  };

  const formatDate = (date) => {
    const options = { day: "numeric", month: "short", year: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return (
    // <div className="main-cont">

    <div className="meetings-container">
      <SearchBar setSearchTerm={setSearchTerm} />
      <div className="meetings-header">
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "inbox" ? "active" : ""}`}
            onClick={() => handleTabClick("inbox")}
          >
            Inbox
          </button>
          <button
            className={`tab-button ${activeTab === "sent" ? "active" : ""}`}
            onClick={() => handleTabClick("sent")}
          >
            Sent
          </button>
          <button
            className={`tab-button ${activeTab === "drafts" ? "active" : ""}`}
            onClick={() => handleTabClick("drafts")}
          >
            Drafts
          </button>
        </div>

        <button className="compose-button" onClick={handleComposeClick}>
          <Pencil className="icon" />
          Compose
        </button>

        <button className="config-button" onClick={handleEditConfig}>
          <Settings className="icon" />
          Email Config
        </button>
      </div>

      <div className="date-nav">
        <h2>E-MAILS</h2>
        <div className="date-controls">
          <button
            className="date-nav-content-button"
            onClick={handlePreviousDay}
          >
            <ChevronLeft />
          </button>
          <span onClick={handleSortByDate}>{formatDate(currentDate)}</span>
          <button className="date-nav-content-button" onClick={handleNextDay}>
            <ChevronRight />
          </button>
        </div>
      </div>

      <main>
        {loading ? (
          <p className="loading-message">Loading...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : activeTab === "inbox" ? (
          <InboxSection emails={filteredEmails} />
        ) : activeTab === "sent" ? (
          <SentSection emails={sentEmails} />
        ) : (
          <DraftSection drafts={drafts} />
        )}
      </main>
    </div>
    // </div>
  );
};

export default Inbox;
