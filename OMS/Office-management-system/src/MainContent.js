import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiClipboard,
  FiFileText,
  FiVideo,
  FiCheckSquare,
  FiMessageSquare,
  FiMail,
  FiHelpCircle,
  FiPhoneCall,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiX,
  FiFileMinus,
  FiBarChart,
} from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./Components/AuthProvider/AuthContext.js";

// Components
import Homepage from "./Components/Homepage";
import axios from "axios";
import Db from "./Components/Db";
import Employee from "./Components/Employee";
import Meeting from "./Components/Meeting";
import CandidateProfile from "./Components/CandidatePf";
import Attendance from "./Components/Attendance";
import FaceAttendance from "./Components/FaceAttendance";
import EmployeeAttendance from "./Components/EmplyeAtendnc";
import ProjectList from "./Components/ProjectList";
import Todo from "./Components/Todo-list/Todo";
import Chat from "./Components/chats/chat";
import Inbox from "./Components/mail/Inbox";
import SendEmail from "./Components/mail/SendEmail";
import EmailDetails from "./Components/mail/EmailDetails";
import EmailConfig from "./Components/mail/EmailConfig";
import Calender from "./Components/calender/calender";
import Certificate from "./Components/Certificates/Certificate.js";
import CertificateHistory from "./Components/Certificates/CertificateHistory.js";
import CompletionHistory from "./Components/Certificates/CompletionHistory.js";
import OfferHistory from "./Components/Certificates/OfferHistory.js";
import ViewDetails from "./Components/ViewDetails.js";
import EditEmployee from "./Components/EditEmployee.js";
// import HrAttendance from "./Components/HrAttendance";
import HRRegistration from "./Components/HRRegistration/HRRegistration";
import Invoice from "./Components/invoice/Invoice";
import AdminDashboard from "./AdminDashboard.js";
import ProjectManagerDashboard from "./Components/ProjectManager/ProjectManagerDashboard";
import TeamLeadDashboard from "./Components/TeamLead/TeamLeadDashboard.js";
import SuperAdminProjectView from "./Components/SuperAdminLeaveManagement/SuperAdminProjectView.js";
import EmployeeDashboard from "./Components/Employee/EmployeeDashboard.js";
import EmployeeProjects from "./Components/Employee/EmployeeProjects.js";
import SuperAdminLeaveManagement from "./Components/SuperAdminLeaveManagement/SuperAdminLeaveManagement";
import HRLeaveApplication from "./Components/HRLeaveApplication/HRLeaveApplication.js";
import HRLeaveManagement from "./Components/HRLeaveManagement/HRLeaveManagement.js";
import AnalyticsManagement from "./Components/AnalyticsManagement/AnalyticsManagement.js";
import ChargeHandover from "./Components/ChargeHandover/ChargeHandover.js";

const MainContent = ({ nav }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const location = useLocation();
  const name = user?.name || "User";

  // Determine navigation base path based on user role
  const rolePaths = {
    Super_Admin: "/super_admin",
    Admin: "/admin",
    Employee: "/employee",
    Intern: "/intern",
  };
  const safeNav = user?.role ? rolePaths[user.role] : "/user";

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);

      // Auto-close on mobile when resizing to desktop
      if (newWidth > 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Initialize based on screen size
    if (window.innerWidth > 768) {
      setIsOpen(true);
      setIsCollapsed(false);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const isMobile = windowWidth <= 768;

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!user?.role)
      return [{ path: "/", label: "Dashboard", icon: <FiHome /> }];

    const commonItems = [
      { path: "/", label: "Dashboard", icon: <FiHome /> },
      { path: "/ProjectList", label: "Projects", icon: <FiFileText /> },
      { path: "/Meeting", label: "Meeting", icon: <FiVideo /> },
      { path: "/Calender", label: "Calendar", icon: <FiCalendar /> },
      { path: "/chat", label: "Chat", icon: <FiMessageSquare /> },
      { path: "/Todo", label: "Todo", icon: <FiCheckSquare /> },
      { path: "/Inbox", label: "Mailbox", icon: <FiMail /> },
    ];

    const roleSpecificItems = {
      Super_Admin: [
        { path: "/Db", label: "Employees", icon: <FiUsers /> },
        // {
        //   path: "/hrAttendance",
        //   label: "HR Attendance",
        //   icon: <FiClipboard />,
        // },
        // { path: "/QuotationList", label: "Quotations", icon: <FiFileText /> },
        { path: "/Invoice", label: "Invoice", icon: <FiFileMinus /> },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/super-admin-leave-management",
          label: "Leave Management",
          icon: <FiClipboard />,
        },
      ],
      Admin: [
        { path: "/Db", label: "Employees", icon: <FiUsers /> },
        { path: "/certificate", label: "Certificate", icon: <FiFileText /> },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        // {
        //   path: "/hrAttendance",
        //   label: "HR Attendance",
        //   icon: <FiClipboard />,
        // },
        {
          path: "/hr-leave-application",
          label: "Apply Leave",
          icon: <FiFileText />,
        },
        {
          path: "/hr-leave-management",
          label: "Leave Management",
          icon: <FiClipboard />,
        },
        {
          path: "/analytics-management",
          label: "Analytics Management",
          icon: <FiBarChart />,
        },
      ],
      Admin_HR: [
        { path: "/Db", label: "Employees", icon: <FiUsers /> },
        // { path: "/hr-leave-application", label: "Apply Leave", icon: <FiFileText /> },
        { path: "/certificate", label: "Certificate", icon: <FiFileText /> },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hr-leave-management",
          label: "Leave Management",
          icon: <FiClipboard />,
        },
        {
          path: "/analytics-management",
          label: "Analytics Management",
          icon: <FiBarChart />,
        },
      ],
      Admin_HR_Manager: [
        { path: "/Db", label: "Employees", icon: <FiUsers /> },
        { path: "/certificate", label: "Certificate", icon: <FiFileText /> },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hr-leave-management",
          label: "Leave Management",
          icon: <FiClipboard />,
        },
        {
          path: "/analytics-management",
          label: "Analytics Management",
          icon: <FiBarChart />,
        },
        {
          path: "/charge-handover",
          label: "Charge Handover",
          icon: <FiFileText />,
        },
      ],
      // "Admin_HR Manager": [
      //   { path: "/Db", label: "Employees", icon: <FiUsers /> },
      //   {
      //     path: "/hr-registration",
      //     label: "Registration",
      //     icon: <FiUsers />,
      //   },

      //   { path: "/certificate", label: "Certificate", icon: <FiFileText /> },
      //   { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
      //   {
      //     path: "/hrAttendance",
      //     label: "HR Attendance",
      //     icon: <FiClipboard />,
      //   },
      //   { path: "/hr-leave-application", label: "Apply Leave", icon: <FiFileText /> },
      // ],
      Employee: [
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hr-leave-application",
          label: "Apply Leave",
          icon: <FiFileText />,
        },
      ],
      Intern: [
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hr-leave-application",
          label: "Apply Leave",
          icon: <FiFileText />,
        },
      ],
      Employee_Team_Lead: [
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hr-leave-application",
          label: "Apply Leave",
          icon: <FiFileText />,
        },
      ],
    };

    // Check for subrole first
    let roleKey = user.role;

    if (user.subRole) {
      const subroleKey = `${user.role}_${user.subRole.replace(/\s+/g, "_")}`;
      if (roleSpecificItems[subroleKey]) {
        roleKey = subroleKey;
      }
    }

    const finalMenuItems = [
      ...commonItems,
      ...(roleSpecificItems[roleKey] || []),
    ];
    return finalMenuItems;
  };

  const [leaveNotification, setLeaveNotification] = useState(false);
  const [chatNotification, setChatNotification] = useState(false);

  useEffect(() => {
    // Fetch pending leave applications for notification
    axios.get("http://localhost:5001/api/leave/recent")
      .then(res => setLeaveNotification(Array.isArray(res.data) && res.data.length > 0))
      .catch(() => setLeaveNotification(false));

    // Listen for chat unread event from chat.js (window event or global state)
    const handleChatUnread = (e) => {
      if (e.detail && Array.isArray(e.detail.chats)) {
        const hasUnread = e.detail.chats.some(chat => chat.unreadCount > 0 || chat.notification);
        setChatNotification(hasUnread);
      }
    };
    window.addEventListener("chat-unread-status", handleChatUnread);
    return () => window.removeEventListener("chat-unread-status", handleChatUnread);
  }, []);

  const menuItems = getMenuItems();

  const handleLinkClick = () => {
    if (isMobile) setIsOpen(false);
  };

  // Custom function to determine if a link is active
  const isLinkActive = (path) => {
    const fullPath = `${safeNav}${path}`;
    return path === "/"
      ? location.pathname === fullPath
      : location.pathname.startsWith(fullPath);
  };

  // Calculate the margin for main content - MAIN CHANGE HERE
  const getMainContentStyle = () => {
    if (isMobile) {
      return {};
    }
    return {
      marginLeft: isOpen
        ? isCollapsed
          ? "var(--sidebar-collapsed)"
          : "var(--sidebar-width)"
        : "0",
      width: isOpen
        ? isCollapsed
          ? "calc(100% - var(--sidebar-collapsed))"
          : "calc(100% - var(--sidebar-width))"
        : "100%",
    };
  };

  return (
    <>
      <style>
        {`
        /* ========== Base Variables ========== */
        :root {
          --primary-color: #6366f1;
          --primary-light: #8b5cf6;
          --primary-dark: #4f46e5;
          --background: #ffffff;
          --sidebar-bg: #1e293b;
          --sidebar-bg-light: #334155;
          --text-color: #ffffff;
          --text-light: #94a3b8;
          --text-muted: #64748b;
          --border-color: #374151;
          --hover-bg: #374151;
          --active-bg: #4f46e5;
          --active-bg-light: rgba(79, 70, 229, 0.1);
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-dark: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --sidebar-width: 280px;
          --sidebar-collapsed: 80px;
          --mobile-z-index: 1000;
        }

        /* ========== Sidebar Container ========== */
        .sidebar-container {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--sidebar-width);
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          box-shadow: var(--shadow-dark);
          z-index: var(--mobile-z-index);
          transition: var(--transition);
          transform: translateX(-100%);
          display: flex;
          flex-direction: column;
        }

        .sidebar-container.open {
          transform: translateX(0);
        }

        .sidebar-container.collapsed {
          width: var(--sidebar-collapsed);
        }

        .sidebar-container.collapsed .logo-text,
        .sidebar-container.collapsed .menu-text,
        .sidebar-container.collapsed .section-title,
        .sidebar-container.collapsed .user-info,
        .sidebar-container.collapsed .support-link span,
        .sidebar-container.collapsed .logout-button span {
          display: none;
        }

        .sidebar-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 1.5rem 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Custom scrollbar for sidebar */
        .sidebar-content::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-content::-webkit-scrollbar-track {
          background: var(--sidebar-bg-light);
        }

        .sidebar-content::-webkit-scrollbar-thumb {
          background: var(--text-muted);
          border-radius: 3px;
        }

        .sidebar-content::-webkit-scrollbar-thumb:hover {
          background: var(--text-light);
        }

        /* Hide horizontal scrollbar but keep vertical scrollbar when sidebar is collapsed */
        .sidebar-container.collapsed .sidebar-content {
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* ========== Mobile Toggle ========== */
        .mobile-menu-toggle {
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: calc(var(--mobile-z-index) + 10);
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 0.5rem;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow);
          transition: var(--transition);
        }

        .mobile-menu-toggle:hover {
          background: var(--primary-dark);
        }

        /* ========== Collapse Toggle ========== */
        .collapse-toggle {
          position: absolute;
          top: 1rem;
          right: -0.75rem;
          background: var(--sidebar-bg);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          width: 1.5rem;
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow);
          z-index: 10;
          transition: var(--transition);
          color: var(--text-light);
        }

        .collapse-toggle:hover {
          background: var(--hover-bg);
          color: var(--text-color);
          transform: translateX(2px);
        }

        /* ========== Sidebar Header ========== */
        .sidebar-header {
          display: flex;
          align-items: center;
          padding: 0 1.5rem 1.5rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border-color);
        }

        .logo {
          width: 2.5rem;
          height: 2.5rem;
          object-fit: contain;
          margin-right: 0.75rem;
          filter: brightness(0) invert(1);
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-color);
          white-space: nowrap;
          transition: opacity 0.2s ease;
          letter-spacing: -0.02em;
        }

        /* ========== Menu Sections ========== */
        .menu-section,
        .support-section {
          padding: 0 1rem;
          margin-bottom: 1.5rem;
        }

        .sidebar-container.collapsed .menu-section,
        .sidebar-container.collapsed .support-section {
          padding: 0 0.5rem;
        }

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-light);
          margin-bottom: 0.75rem;
          padding: 0 0.75rem;
          font-weight: 600;
        }

        .sidebar-container.collapsed .section-title {
          padding: 0;
          text-align: center;
        }

        /* ========== Menu Items ========== */
        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .menu-item {
          display: flex;
          align-items: center;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          color: var(--text-light);
          text-decoration: none;
          transition: var(--transition);
          position: relative;
          margin: 0 0.75rem;
          font-weight: 500;
        }

        .menu-item:hover {
          background: var(--hover-bg);
          color: var(--text-color);
          transform: translateX(4px);
        }

        .menu-item.active {
          background: var(--active-bg);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .menu-item.active::before {
          content: '';
          position: absolute;
          left: -0.75rem;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 1.5rem;
          background: var(--primary-light);
          border-radius: 0 2px 2px 0;
        }

        .menu-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.875rem;
          flex-shrink: 0;
          font-size: 1.125rem;
        }

        /* Collapsed state adjustments */
        .sidebar-container.collapsed .menu-item {
          padding: 0.875rem 0.5rem;
          margin: 0 0.5rem;
          justify-content: center;
        }

        .sidebar-container.collapsed .menu-icon {
          margin-right: 0;
          width: 1.75rem;
          height: 1.75rem;
          font-size: 1.25rem;
        }

        .sidebar-container.collapsed .menu-item:hover {
          transform: none;
        }

        .sidebar-container.collapsed .menu-item.active::before {
          left: -0.5rem;
          width: 3px;
        }

        /* Tooltip for collapsed sidebar */
        .sidebar-container.collapsed .menu-item {
          position: relative;
        }

        .sidebar-container.collapsed .menu-item::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 15px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--sidebar-bg);
          color: var(--text-color);
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          white-space: nowrap;
          box-shadow: var(--shadow-dark);
          border: 1px solid var(--border-color);
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 1000;
          pointer-events: none;
        }

        .sidebar-container.collapsed .menu-item:hover::after {
          opacity: 1;
          visibility: visible;
        }

        .sidebar-container.collapsed .menu-item::before {
          content: '';
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 5px 5px 5px 0;
          border-color: transparent var(--sidebar-bg) transparent transparent;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          z-index: 999;
        }

        .sidebar-container.collapsed .menu-item:hover::before {
          opacity: 1;
          visibility: visible;
        }

        .sidebar-container.collapsed .menu-item.active::before {
          left: -0.5rem;
          width: 3px;
          height: 1.5rem;
          background: var(--primary-light);
          border-radius: 0 2px 2px 0;
          border: none;
          transform: translateY(-50%);
          opacity: 1;
          visibility: visible;
        }

        /* Colorful icons */
        .menu-item:nth-child(1) .menu-icon { color: #3b82f6; } /* Dashboard - Blue */
        .menu-item:nth-child(2) .menu-icon { color: #10b981; } /* Projects - Green */
        .menu-item:nth-child(3) .menu-icon { color: #f59e0b; } /* Meeting - Orange */
        .menu-item:nth-child(4) .menu-icon { color: #ef4444; } /* Calendar - Red */
        .menu-item:nth-child(5) .menu-icon { color: #8b5cf6; } /* Chat - Purple */
        .menu-item:nth-child(6) .menu-icon { color: #06b6d4; } /* Todo - Cyan */
        .menu-item:nth-child(7) .menu-icon { color: #f97316; } /* Mailbox - Orange */
        .menu-item:nth-child(8) .menu-icon { color: #84cc16; } /* Employees - Lime */
        .menu-item:nth-child(9) .menu-icon { color: #ec4899; } /* Certificate - Pink */
        .menu-item:nth-child(10) .menu-icon { color: #6366f1; } /* Attendance - Indigo */
        .menu-item:nth-child(11) .menu-icon { color: #14b8a6; } /* Leave - Teal */
        .menu-item:nth-child(12) .menu-icon { color: #f43f5e; } /* Analytics - Rose */

        .menu-item.active .menu-icon {
          color: white;
        }

        .menu-text {
          white-space: nowrap;
          transition: opacity 0.2s ease;
          font-size: 0.9rem;
        }

        .active-indicator {
          position: absolute;
          right: 1rem;
          width: 0.5rem;
          height: 0.5rem;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        }

        .sidebar-container.collapsed .active-indicator {
          right: 0.5rem;
          width: 0.4rem;
          height: 0.4rem;
        }

        /* ========== Support Links ========== */
        .support-links {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .support-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          color: var(--text-light);
          text-decoration: none;
          transition: var(--transition);
          margin: 0 0.75rem;
        }

        .support-link:hover {
          background: var(--hover-bg);
          color: var(--text-color);
        }

        .support-link svg {
          margin-right: 0.75rem;
          width: 1.5rem;
          height: 1.5rem;
          flex-shrink: 0;
          color: var(--text-muted);
        }

        .support-link:hover svg {
          color: var(--primary-color);
        }

        /* ========== User Section ========== */
        .user-section {
          margin-top: auto;
          padding: 1.5rem 1rem 0;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sidebar-container.collapsed .user-section {
          padding: 1.5rem 0.5rem 0;
          justify-content: center;
          flex-direction: column;
          gap: 0.5rem;
        }

        .user-avatar {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
          font-size: 1.1rem;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .sidebar-container.collapsed .user-avatar {
          width: 2.25rem;
          height: 2.25rem;
          font-size: 1rem;
        }

        .user-info {
          flex-grow: 1;
          overflow: hidden;
        }

        .user-name {
          font-weight: 600;
          color: var(--text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.95rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-light);
          text-transform: capitalize;
          margin-top: 0.125rem;
        }

        .user-subrole {
          font-size: 0.7rem;
          color: var(--primary-light);
          font-weight: 500;
          text-transform: capitalize;
          margin-top: 2px;
        }

        .logout-button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: var(--transition);
        }

        .logout-button:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .logout-button svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .logout-button span {
          margin-left: 0.5rem;
          white-space: nowrap;
        }

        .sidebar-container.collapsed .logout-button {
          padding: 0.75rem;
        }

        /* ========== Overlay ========== */
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: calc(var(--mobile-z-index) - 1);
          backdrop-filter: blur(4px);
        }

        /* ========== Main Content ========== */
        .main-cont {
          width: 100%;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          transition: var(--transition);
          padding: 20px;
        }

        /* ========== Responsive Styles ========== */
        @media (min-width: 769px) {
          .sidebar-container {
            transform: translateX(0);
          }

          .mobile-menu-toggle {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .sidebar-container {
            width: 280px;
          }

          .sidebar-container.collapsed {
            width: 280px;
          }
          
          .main-cont {
            margin-left: 0;
            width: 100%;
          }
        }
        `}
      </style>

      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="mobile-menu-toggle"
          onClick={toggleMenu}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {/* Sidebar container */}
      <aside
        className={`sidebar-container ${isOpen ? "open" : ""} ${
          isCollapsed ? "collapsed" : ""
        }`}
        aria-hidden={!isOpen && isMobile}
      >
        {/* Desktop collapse toggle */}
        {!isMobile && (
          <button
            className="collapse-toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <FiChevronRight size={14} />
            ) : (
              <FiChevronLeft size={14} />
            )}
          </button>
        )}

        {/* Mobile overlay */}
        {isMobile && isOpen && (
          <div
            className="sidebar-overlay"
            onClick={toggleMenu}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
        )}

        <div className="sidebar-content">
          {/* Sidebar header */}
          <div className="sidebar-header">
            <img
              src="/Images/image_1-removebg-preview 1.png"
              alt="Company Logo"
              className="logo"
            />
            {!isCollapsed && <span className="logo-text">OMS</span>}
          </div>

          {/* Menu section */}
          <div className="menu-section">
            <h2 className="section-title">Menu</h2>
            <nav aria-label="Main navigation">
              <ul className="sidebar-menu">
                {menuItems.map((item, index) => {
                  // Notification logic
                  let showNotif = false;
                  const label = item.label.trim().toLowerCase();
                  const path = item.path.trim().toLowerCase();
                  // Only show leave notification for Leave Management, not Apply Leave
                  if (label.includes("leave management")) {
                    showNotif = leaveNotification;
                  }
                  // Show chat notification for Chat menu item (by label or path)
                  if (label === "chat" || path === "/chat") {
                    showNotif = chatNotification;
                  }
                  return (
                    <li key={index}>
                      <NavLink
                        to={`${safeNav}${item.path}`}
                        className={`menu-item ${
                          isLinkActive(item.path) ? "active" : ""
                        }`}
                        onClick={handleLinkClick}
                        end={item.path === "/"}
                        aria-current={
                          isLinkActive(item.path) ? "page" : undefined
                        }
                        data-tooltip={item.label}
                      >
                        <div className="menu-icon" aria-hidden="true" style={{ position: "relative" }}>
                          {item.icon}
                          {showNotif && (
                            <span style={{
                              position: "absolute",
                              top: 0,
                              right: -2,
                              width: 10,
                              height: 10,
                              background: "#ef4444",
                              borderRadius: "50%",
                              display: "inline-block",
                              border: "2px solid #1e293b"
                            }} />
                          )}
                        </div>
                        {!isCollapsed && (
                          <span className="menu-text">{item.label}</span>
                        )}
                        {isLinkActive(item.path) && (
                          <div className="active-indicator" aria-hidden="true" />
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>


          {/* User section */}
          <div className="user-section">
            <div className="user-avatar" aria-hidden="true">
              {(typeof name === "string" && name.charAt(0).toUpperCase()) ||
                "U"}
            </div>

            {!isCollapsed && (
              <div className="user-info">
                <div className="user-name">{name || "User"}</div>
                <div className="user-role">
                  {user?.role?.replace(/_/g, " ") || "Role"}
                </div>
                {user?.subRole && (
                  <div className="user-subrole">{user.subRole}</div>
                )}
              </div>
            )}
            <button
              onClick={logout}
              className="logout-button"
              aria-label="Logout"
            >
              <FiLogOut />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="main-cont" style={getMainContentStyle()}>
        <Routes>
          <Route
            path="/"
            element={
              user?.role === "Super_Admin" ? (
                <AdminDashboard />
              ) : user?.role === "Admin" &&
                user?.subRole === "Project_Manager" ? (
                <ProjectManagerDashboard />
              ) : user?.role === "Employee" && user?.subRole === "Team_Lead" ? (
                <TeamLeadDashboard />
              ) : (
                <Homepage />
              )
            }
          />
          <Route path="/Db" element={<Db />} />
          <Route path="/Db/employee" element={<Employee />} />
          <Route path="/Db/viewDetails/:id" element={<ViewDetails />} />
          <Route path="/database/edit/:id" element={<EditEmployee />} />
          <Route path="/Db/edit/:id" element={<EditEmployee />} />
          <Route path="/CandidateProfile" element={<CandidateProfile />} />
          <Route path="/Attendance" element={<Attendance />} />
          <Route path="/FaceAttendance" element={<FaceAttendance />} />
          <Route path="/EmplyeAtendnc" element={<EmployeeAttendance />} />
          <Route path="/Meeting" element={<Meeting />} />
          <Route
            path="/ProjectList"
            element={
              user?.role === "Super_Admin" ? (
                <SuperAdminProjectView nav={nav} />
              ) : user?.role === "Employee" &&
              user?.subRole === "Project Manager" ? (
                <ProjectManagerDashboard nav={nav} />
              ) : user?.role === "Employee" && user?.subRole === "Team Lead" ? (
                <TeamLeadDashboard nav={nav} />
              ) : user?.role === "Employee" ? (
                <EmployeeProjects nav={nav} />
              ) : (
                <ProjectList nav={nav} />
              )
            }
          />
          <Route
            path="/team-lead-dashboard"
            element={<TeamLeadDashboard nav={nav} />}
          />
          <Route
            path="/employee-dashboard"
            element={<EmployeeDashboard nav={nav} />}
          />
          {/* <Route path="/QuotationList" element={<QuotationList />} /> */}
          <Route path="/Todo" element={<Todo />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/Inbox" element={<Inbox />} />
          <Route path="/Inbox/send-email" element={<SendEmail />} />
          <Route path="/Inbox/email-details" element={<EmailDetails />} />
          <Route path="/email-config" element={<EmailConfig />} />
          <Route path="/Calender" element={<Calender />} />
          <Route path="/Certificate" element={<Certificate />} />
          <Route path="/CertificateHistory" element={<CertificateHistory />} />
          <Route path="/CompletionHistory" element={<CompletionHistory />} />
          <Route path="/OfferHistory" element={<OfferHistory />} />
          {/* <Route path="/hrAttendance" element={<HrAttendance />} /> */}
          <Route path="/Invoice" element={<Invoice />} />
          <Route
            path="/super-admin-leave-management"
            element={<SuperAdminLeaveManagement />}
          />
          <Route
            path="/analytics-management"
            element={<AnalyticsManagement />}
          />
          <Route
            path="/hr-leave-application"
            element={<HRLeaveApplication />}
          />
          <Route path="/hr-leave-management" element={<HRLeaveManagement />} />
          <Route path="/charge-handover" element={<ChargeHandover />} />
        </Routes>
      </div>
    </>
  );
};

export default MainContent;