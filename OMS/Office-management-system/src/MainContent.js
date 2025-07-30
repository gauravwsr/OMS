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
} from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "./Components/AuthProvider/AuthContext.js";

// Components
import Homepage from "./Components/Homepage";
import Db from "./Components/Db";
import Employee from "./Components/Employee";
import Meeting from "./Components/Meeting";
import CandidateProfile from "./Components/CandidatePf";
import Attendance from "./Components/Attendance";
import EmployeeAttendance from "./Components/EmplyeAtendnc";
import ProjectList from "./Components/ProjectList";
// import QuotationList from './Components/Technical/QuotationList';
import Todo from "./Components/Todo-list/Todo";
import Chat from "./Components/chats/chat";
import Inbox from "./Components/mail/Inbox";
import SendEmail from "./Components/mail/SendEmail";
import EmailDetails from "./Components/mail/EmailDetails";
import Calender from "./Components/calender/calender";
import Certificate from "./Components/Certificates/Certificate";
import ViewDetails from "./Components/ViewDetails";
import HrAttendance from "./Components/HrAttendance";
import HRRegistration from "./Components/HRRegistration/HRRegistration";
import Invoice from "./Components/invoice/Invoice";
import AdminDashboard from "./AdminDashboard.js";
import ProjectManagerDashboard from "./Components/ProjectManager/ProjectManagerDashboard";
import TeamLeadDashboard from "./Components/TeamLead/TeamLeadDashboard.js";
import EmployeeDashboard from "./Components/Employee/EmployeeDashboard.js";
import EmployeeProjects from "./Components/Employee/EmployeeProjects.js";
import SuperAdminLeaveManagement from "./Components/SuperAdminLeaveManagement/SuperAdminLeaveManagement";
import HRLeaveApplication from "./Components/HRLeaveApplication/HRLeaveApplication.js";
import HRLeaveManagement from "./Components/HRLeaveManagement/HRLeaveManagement.js";
import AnalyticsManagement from "./Components/AnalyticsManagement/AnalyticsManagement.js";

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
        {
          path: "/hrAttendance",
          label: "HR Attendance",
          icon: <FiClipboard />,
        },
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
        {
          path: "/hrAttendance",
          label: "HR Attendance",
          icon: <FiClipboard />,
        },
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
      ],
      Admin_HR: [
        { path: "/Db", label: "Employees", icon: <FiUsers /> },
        // { path: "/hr-leave-application", label: "Apply Leave", icon: <FiFileText /> },
        { path: "/certificate", label: "Certificate", icon: <FiFileText /> },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hrAttendance",
          label: "HR Attendance",
          icon: <FiClipboard />,
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
        {
          path: "/employee-dashboard",
          label: "My Projects",
          icon: <FiFileText />,
        },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
        {
          path: "/hr-leave-application",
          label: "Apply Leave",
          icon: <FiFileText />,
        },
      ],
      Intern: [
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
      ],
      Employee_Team_Lead: [
        {
          path: "/team-lead-dashboard",
          label: "My Projects",
          icon: <FiFileText />,
        },
        { path: "/Attendance", label: "Attendance", icon: <FiClipboard /> },
      ],
    };

    // Check for subrole first
    let roleKey = user.role;
    console.log("Debug - User role:", user.role);
    console.log("Debug - User subRole:", user.subRole);
    console.log("Debug - User object:", user);

    if (user.subRole) {
      const subroleKey = `${user.role}_${user.subRole}`;
      console.log("Debug - Checking subroleKey:", subroleKey);
      console.log(
        "Debug - Available roleSpecificItems keys:",
        Object.keys(roleSpecificItems)
      );
      if (roleSpecificItems[subroleKey]) {
        roleKey = subroleKey;
        console.log("Debug - Using subroleKey:", roleKey);
      } else {
        console.log("Debug - Subrole not found, using base role:", roleKey);
      }
    }

    console.log("Debug - Final roleKey being used:", roleKey);
    const finalMenuItems = [
      ...commonItems,
      ...(roleSpecificItems[roleKey] || []),
    ];
    console.log("Debug - Final menu items:", finalMenuItems);
    return finalMenuItems;
  };

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
          --primary-color: #4f46e5;
          --primary-light: #6366f1;
          --primary-dark: #4338ca;
          --background: #ffffff;
          --sidebar-bg: #f8fafc;
          --text-color: #1e293b;
          --text-light: #64748b;
          --border-color: #e2e8f0;
          --hover-bg: #f1f5f9;
          --active-bg: #e0e7ff;
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
          box-shadow: var(--shadow);
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
          background: white;
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
        }

        .collapse-toggle:hover {
          background: var(--hover-bg);
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
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-color);
          white-space: nowrap;
          transition: opacity 0.2s ease;
        }

        /* ========== Menu Sections ========== */
        .menu-section,
        .support-section {
          padding: 0 1rem;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-light);
          margin-bottom: 0.75rem;
          padding: 0 0.75rem;
          font-weight: 600;
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
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: var(--text-color);
          text-decoration: none;
          transition: var(--transition);
          position: relative;
        }

        .menu-item:hover {
          background: var(--hover-bg);
          color: var(--primary-color);
        }

        .menu-item.active {
          background: var(--active-bg);
          color: var(--primary-color);
          font-weight: 500;
        }

        .menu-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }

        .menu-text {
          white-space: nowrap;
          transition: opacity 0.2s ease;
        }

        .active-indicator {
          position: absolute;
          right: 1rem;
          width: 0.5rem;
          height: 0.5rem;
          background: var(--primary-color);
          border-radius: 50%;
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
          border-radius: 0.5rem;
          color: var(--text-color);
          text-decoration: none;
          transition: var(--transition);
        }

        .support-link:hover {
          background: var(--hover-bg);
          color: var(--primary-color);
        }

        .support-link svg {
          margin-right: 0.75rem;
          width: 1.5rem;
          height: 1.5rem;
          flex-shrink: 0;
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

        .user-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .user-info {
          flex-grow: 1;
          overflow: hidden;
        }

        .user-name {
          font-weight: 500;
          color: var(--text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-light);
          text-transform: capitalize;
        }

        .user-subrole {
          font-size: 0.7rem;
          color: var(--primary-color);
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
          color: var(--primary-color);
          background: var(--hover-bg);
        }

        .logout-button svg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .logout-button span {
          margin-left: 0.5rem;
          white-space: nowrap;
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
                {menuItems.map((item, index) => (
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
                    >
                      <div className="menu-icon" aria-hidden="true">
                        {item.icon}
                      </div>
                      {!isCollapsed && (
                        <span className="menu-text">{item.label}</span>
                      )}
                      {isLinkActive(item.path) && !isCollapsed && (
                        <div className="active-indicator" aria-hidden="true" />
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Support section */}
          <div className="support-section">
            <h2 className="section-title">Support</h2>
            <nav aria-label="Support navigation">
              <ul className="support-links">
                <li>
                  <a href="#" className="support-link">
                    <FiHelpCircle />
                    {!isCollapsed && <span>Help</span>}
                  </a>
                </li>
                <li>
                  <a href="#" className="support-link">
                    <FiPhoneCall />
                    {!isCollapsed && <span>Contact</span>}
                  </a>
                </li>
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
              ) : user?.role === "Employee" ? (
                <EmployeeDashboard />
              ) : (
                <Homepage />
              )
            }
          />
          <Route path="/Db" element={<Db />} />
          <Route path="/Db/employee" element={<Employee />} />
          <Route path="/Db/viewDetails/:id" element={<ViewDetails />} />
          <Route path="/hr-registration" element={<HRRegistration />} />
          <Route path="/CandidateProfile" element={<CandidateProfile />} />
          <Route path="/Attendance" element={<Attendance />} />
          <Route path="/EmplyeAtendnc" element={<EmployeeAttendance />} />
          <Route path="/Meeting" element={<Meeting />} />
          <Route
            path="/ProjectList"
            element={
              user?.role === "Employee" &&
              user?.subRole === "Project Manager" ? (
                <ProjectManagerDashboard nav={nav} />
              ) : user?.role === "Employee" && user?.subRole === "Team Lead" ? (
                <TeamLeadDashboard nav={nav} />
              ) : user?.role === "Employee" ? (
                <EmployeeProjects nav={nav}  />
              ):(
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
          <Route path="/Calender" element={<Calender />} />
          <Route path="/Certificate" element={<Certificate />} />
          <Route path="/hrAttendance" element={<HrAttendance />} />
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
        </Routes>
      </div>
    </>
  );
};

export default MainContent;
