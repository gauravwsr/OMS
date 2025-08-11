import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider/AuthContext";
import SearchBar from "../Search-bar/SearchBar";
import InboxSection from "./InboxSection";
import SentSection from "./SentSection";
import DraftSection from "./DraftSection";
import EmailConfig from "./EmailConfig";
import "./Inbox.css";

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

  const checkEmailConfiguration = async () => {
    setCheckingConfig(true);
    try {
      const response = await fetch('http://146.190.165.62:5001/api/emails/check-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      );

      const data = await response.json();
      if (response.ok && data.configured) {
        setIsEmailConfigured(true);
      }
    } catch (error) {
      console.error("Error checking email configuration:", error);
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
    navigate("/email-config");
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
      url = 'http://146.190.165.62:5001/api/emails/inbox';
    } else if (activeTab === 'sent') {
      url = 'http://146.190.165.62:5001/api/emails/sent';
    } else if (activeTab === 'drafts') {
      url = 'http://146.190.165.62:5001/api/emails/drafts';
    }

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch data");
      }

      if (activeTab === "inbox") {
        setEmails(data.emails || []);
        setFilteredEmails(data.emails || []);
      } else if (activeTab === "sent") {
        setSentEmails(data.emails || []);
      } else if (activeTab === "drafts") {
        setDrafts(data.emails || data || []);
      }
    } catch (err) {
      console.error(`Error fetching ${activeTab} emails:`, err);
      // More specific error handling
      if (err.message.includes("Email not configured")) {
        setIsEmailConfigured(false);
        setError("Please configure your email settings first");
      } else if (
        err.message.includes("timeout") ||
        err.message.includes("IMAP")
      ) {
        setError(
          `Connection timeout. Please check your internet connection and email server settings.`
        );
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
  );
};

export default Inbox;
