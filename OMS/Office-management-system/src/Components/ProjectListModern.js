import "./ProjectListModern.css";
import { Calendar, ChevronLeft, ChevronRight, Plus, Filter, Search, Eye, Edit, Trash2, MoreVertical, Star, Users, Clock, TrendingUp, FolderOpen, Activity } from "lucide-react";
import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { FiMenu, FiBell, FiGrid, FiList } from "react-icons/fi";
import SearchBar from "./Search-bar/SearchBar";

export default function ProjectListModern() {
    const [showModal, setShowModal] = useState(false);
    const [showKanban, setShowKanban] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(newIsMobile);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Enhanced sample project data
    const projects = [
        {
            id: 1,
            title: "E-commerce Platform Development",
            description: "A comprehensive e-commerce solution with modern UI/UX, payment integration, and advanced analytics dashboard for seamless online shopping experience.",
            startDate: "2024-08-01",
            dueDate: "2024-12-15",
            status: "in-progress",
            priority: "high",
            progress: 65,
            team: [
                { name: "Alice Johnson", role: "Frontend Developer", avatar: "AJ" },
                { name: "Bob Smith", role: "Backend Developer", avatar: "BS" },
                { name: "Carol Wilson", role: "UI/UX Designer", avatar: "CW" }
            ],
            tags: ["React", "Node.js", "MongoDB", "Stripe"],
            budget: "$50,000",
            spent: "$32,500",
            client: "TechCorp Ltd",
            category: "Web Development",
            lastActivity: "2 hours ago",
            upcomingDeadline: "Feature review - Dec 1st",
            riskLevel: "low"
        },
        {
            id: 2,
            title: "Mobile Banking Application",
            description: "Secure mobile banking app with biometric authentication, real-time transactions, and comprehensive financial management tools.",
            startDate: "2024-07-15",
            dueDate: "2024-11-30",
            status: "planning",
            priority: "high",
            progress: 25,
            team: [
                { name: "David Lee", role: "Mobile Developer", avatar: "DL" },
                { name: "Emma Davis", role: "Security Expert", avatar: "ED" },
                { name: "Frank Miller", role: "QA Engineer", avatar: "FM" }
            ],
            tags: ["React Native", "Firebase", "Security", "Biometrics"],
            budget: "$75,000",
            spent: "$18,750",
            client: "SecureBank Inc",
            category: "Mobile App",
            lastActivity: "1 day ago",
            upcomingDeadline: "Security audit - Nov 15th",
            riskLevel: "medium"
        },
        {
            id: 3,
            title: "AI-Powered Analytics Dashboard",
            description: "Machine learning dashboard for predictive analytics with real-time data visualization and intelligent business insights.",
            startDate: "2024-06-20",
            dueDate: "2024-10-25",
            status: "completed",
            priority: "medium",
            progress: 100,
            team: [
                { name: "Grace Taylor", role: "Data Scientist", avatar: "GT" },
                { name: "Henry Brown", role: "ML Engineer", avatar: "HB" },
                { name: "Ivy Chen", role: "Frontend Developer", avatar: "IC" }
            ],
            tags: ["Python", "TensorFlow", "D3.js", "AWS"],
            budget: "$60,000",
            spent: "$58,200",
            client: "DataTech Solutions",
            category: "Data Analytics",
            lastActivity: "3 days ago",
            upcomingDeadline: "Project handover - Complete",
            riskLevel: "low"
        },
        {
            id: 4,
            title: "Cloud Infrastructure Migration",
            description: "Complete migration of legacy systems to modern cloud infrastructure with enhanced security, scalability, and cost optimization.",
            startDate: "2024-08-10",
            dueDate: "2025-02-28",
            status: "on-hold",
            priority: "medium",
            progress: 15,
            team: [
                { name: "Jack Anderson", role: "DevOps Engineer", avatar: "JA" },
                { name: "Kate Wilson", role: "Cloud Architect", avatar: "KW" },
                { name: "Liam Johnson", role: "Security Specialist", avatar: "LJ" }
            ],
            tags: ["AWS", "Docker", "Kubernetes", "Terraform"],
            budget: "$90,000",
            spent: "$13,500",
            client: "GlobalTech Corp",
            category: "Infrastructure",
            lastActivity: "1 week ago",
            upcomingDeadline: "Budget review - Jan 15th",
            riskLevel: "high"
        },
        {
            id: 5,
            title: "Healthcare Management System",
            description: "Comprehensive healthcare platform with patient management, appointment scheduling, telemedicine, and electronic health records.",
            startDate: "2024-09-01",
            dueDate: "2025-03-15",
            status: "in-progress",
            priority: "high",
            progress: 40,
            team: [
                { name: "Maya Patel", role: "Full Stack Developer", avatar: "MP" },
                { name: "Noah Garcia", role: "Healthcare Consultant", avatar: "NG" },
                { name: "Olivia Martinez", role: "UI/UX Designer", avatar: "OM" }
            ],
            tags: ["Vue.js", "PostgreSQL", "HIPAA", "Telemedicine"],
            budget: "$80,000",
            spent: "$32,000",
            client: "MediCare Systems",
            category: "Healthcare",
            lastActivity: "5 hours ago",
            upcomingDeadline: "HIPAA compliance review - Dec 20th",
            riskLevel: "medium"
        },
        {
            id: 6,
            title: "Blockchain Voting Platform",
            description: "Secure and transparent voting system using blockchain technology with advanced encryption, audit trails, and real-time results.",
            startDate: "2024-07-01",
            dueDate: "2024-12-01",
            status: "completed",
            priority: "high",
            progress: 100,
            team: [
                { name: "Paul Thompson", role: "Blockchain Developer", avatar: "PT" },
                { name: "Quinn Davis", role: "Cryptography Expert", avatar: "QD" },
                { name: "Ruby Lee", role: "Frontend Developer", avatar: "RL" }
            ],
            tags: ["Blockchain", "Solidity", "Web3", "Ethereum"],
            budget: "$100,000",
            spent: "$95,000",
            client: "Democratic Solutions",
            category: "Blockchain",
            lastActivity: "2 weeks ago",
            upcomingDeadline: "Final deployment - Complete",
            riskLevel: "low"
        }
    ];

    // Filter and search projects
    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            project.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
        
        return matchesSearch && matchesFilter;
    });

    // Pagination
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const currentProjects = filteredProjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Status configurations
    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { 
                    color: '#059669', 
                    bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', 
                    text: 'Completed',
                    icon: '✓'
                };
            case 'in-progress':
                return { 
                    color: '#2563EB', 
                    bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', 
                    text: 'In Progress',
                    icon: '⚡'
                };
            case 'planning':
                return { 
                    color: '#D97706', 
                    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', 
                    text: 'Planning',
                    icon: '📋'
                };
            case 'on-hold':
                return { 
                    color: '#DC2626', 
                    bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', 
                    text: 'On Hold',
                    icon: '⏸️'
                };
            default:
                return { 
                    color: '#6B7280', 
                    bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', 
                    text: 'Unknown',
                    icon: '❓'
                };
        }
    };

    const getPriorityInfo = (priority) => {
        switch (priority) {
            case 'high':
                return { color: '#DC2626', bg: '#FEE2E2', text: 'High Priority', icon: '🔥' };
            case 'medium':
                return { color: '#D97706', bg: '#FEF3C7', text: 'Medium Priority', icon: '⚡' };
            case 'low':
                return { color: '#059669', bg: '#D1FAE5', text: 'Low Priority', icon: '🌱' };
            default:
                return { color: '#6B7280', bg: '#F3F4F6', text: 'Normal', icon: '📌' };
        }
    };

    const getRiskLevelInfo = (riskLevel) => {
        switch (riskLevel) {
            case 'high':
                return { color: '#DC2626', text: 'High Risk', icon: '⚠️' };
            case 'medium':
                return { color: '#D97706', text: 'Medium Risk', icon: '⚡' };
            case 'low':
                return { color: '#059669', text: 'Low Risk', icon: '✅' };
            default:
                return { color: '#6B7280', text: 'Unknown', icon: '❓' };
        }
    };

    const handleAddProject = () => setShowModal(true);
    const closeModal = () => setShowModal(false);
    const handleViewDetails = (project) => setShowKanban(true);

    // Statistics calculations
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const inProgressProjects = projects.filter(p => p.status === 'in-progress').length;
    const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

    return (
        <div className="modern-project-container">
            <Navbar />
            <div className="project-main-content">
                <SearchBar />
                
                {/* Dashboard Header */}
                <div className="dashboard-header">
                    <div className="header-content">
                        <div className="title-section">
                            <h1 className="page-title">
                                <FolderOpen className="title-icon" />
                                Projects Dashboard
                            </h1>
                            <p className="page-subtitle">Manage and track all your projects with advanced analytics</p>
                        </div>
                        <div className="header-actions">
                            <button className="filter-btn">
                                <Filter size={18} />
                                Filter
                            </button>
                            <button className="view-toggle">
                                <FiGrid className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')} />
                                <FiList className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')} />
                            </button>
                            <button className="add-project-btn" onClick={handleAddProject}>
                                <Plus size={18} />
                                New Project
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">
                            <FolderOpen size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>{totalProjects}</h3>
                            <p>Total Projects</p>
                        </div>
                        <div className="stat-trend up">
                            <TrendingUp size={16} />
                            +12%
                        </div>
                    </div>
                    
                    <div className="stat-card completed">
                        <div className="stat-icon">
                            <Activity size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>{completedProjects}</h3>
                            <p>Completed</p>
                        </div>
                        <div className="stat-trend up">
                            <TrendingUp size={16} />
                            +25%
                        </div>
                    </div>
                    
                    <div className="stat-card progress">
                        <div className="stat-icon">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>{inProgressProjects}</h3>
                            <p>In Progress</p>
                        </div>
                        <div className="stat-trend neutral">
                            <TrendingUp size={16} />
                            +5%
                        </div>
                    </div>
                    
                    <div className="stat-card average">
                        <div className="stat-icon">
                            <Star size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>{avgProgress}%</h3>
                            <p>Avg Progress</p>
                        </div>
                        <div className="stat-trend up">
                            <TrendingUp size={16} />
                            +8%
                        </div>
                    </div>
                </div>

                {/* Search and Filter Section */}
                <div className="search-filter-section">
                    <div className="search-container">
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search projects, clients, technologies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    
                    <div className="filter-tabs">
                        {['all', 'in-progress', 'completed', 'planning', 'on-hold'].map(status => {
                            const count = status === 'all' ? projects.length : projects.filter(p => p.status === status).length;
                            return (
                                <button
                                    key={status}
                                    className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
                                    onClick={() => setFilterStatus(status)}
                                >
                                    {status === 'all' ? 'All Projects' : getStatusInfo(status).text}
                                    <span className="tab-count">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Projects Display */}
                <div className={`projects-container ${viewMode}`}>
                    {currentProjects.map((project) => {
                        const statusInfo = getStatusInfo(project.status);
                        const priorityInfo = getPriorityInfo(project.priority);
                        const riskInfo = getRiskLevelInfo(project.riskLevel);
                        
                        return (
                            <div key={project.id} className="modern-project-card">
                                {/* Card Header */}
                                <div className="card-header">
                                    <div className="header-badges">
                                        <span 
                                            className="status-badge"
                                            style={{ background: statusInfo.bg, color: statusInfo.color }}
                                        >
                                            <span className="badge-icon">{statusInfo.icon}</span>
                                            {statusInfo.text}
                                        </span>
                                        <span 
                                            className="priority-badge"
                                            style={{ backgroundColor: priorityInfo.bg, color: priorityInfo.color }}
                                        >
                                            {priorityInfo.icon}
                                        </span>
                                    </div>
                                    <div className="card-actions">
                                        <button className="favorite-btn">
                                            <Star size={16} />
                                        </button>
                                        <button className="menu-btn">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="card-main-content">
                                    <div className="project-info">
                                        <h3 className="project-name">{project.title}</h3>
                                        <p className="project-desc">{project.description}</p>
                                        
                                        <div className="project-details">
                                            <div className="detail-item">
                                                <Users size={14} />
                                                <span className="detail-label">Client:</span>
                                                <span className="detail-value">{project.client}</span>
                                            </div>
                                            <div className="detail-item">
                                                <FolderOpen size={14} />
                                                <span className="detail-label">Category:</span>
                                                <span className="detail-value">{project.category}</span>
                                            </div>
                                            <div className="detail-item">
                                                <Clock size={14} />
                                                <span className="detail-label">Due:</span>
                                                <span className="detail-value">{new Date(project.dueDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Section */}
                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span className="progress-label">Progress</span>
                                            <span className="progress-value">{project.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill"
                                                style={{ 
                                                    width: `${project.progress}%`,
                                                    background: `linear-gradient(90deg, ${statusInfo.color}CC, ${statusInfo.color})`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Budget Section */}
                                    <div className="budget-section">
                                        <div className="budget-item">
                                            <span className="budget-label">Budget:</span>
                                            <span className="budget-value">{project.budget}</span>
                                        </div>
                                        <div className="budget-item">
                                            <span className="budget-label">Spent:</span>
                                            <span className="budget-value spent">{project.spent}</span>
                                        </div>
                                    </div>

                                    {/* Team Section */}
                                    <div className="team-section">
                                        <div className="team-label">
                                            <Users size={14} />
                                            Team ({project.team.length})
                                        </div>
                                        <div className="team-avatars">
                                            {project.team.slice(0, 4).map((member, index) => (
                                                <div 
                                                    key={index} 
                                                    className="team-avatar" 
                                                    title={`${member.name} - ${member.role}`}
                                                >
                                                    {member.avatar}
                                                </div>
                                            ))}
                                            {project.team.length > 4 && (
                                                <div className="team-avatar more">
                                                    +{project.team.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tags Section */}
                                    <div className="tags-section">
                                        {project.tags.slice(0, 4).map((tag, index) => (
                                            <span key={index} className="tech-tag">
                                                {tag}
                                            </span>
                                        ))}
                                        {project.tags.length > 4 && (
                                            <span className="tech-tag more">
                                                +{project.tags.length - 4}
                                            </span>
                                        )}
                                    </div>

                                    {/* Activity & Risk */}
                                    <div className="card-footer-info">
                                        <div className="activity-info">
                                            <Activity size={12} />
                                            <span>Updated {project.lastActivity}</span>
                                        </div>
                                        <div className="risk-info" style={{ color: riskInfo.color }}>
                                            <span>{riskInfo.icon}</span>
                                            <span>{riskInfo.text}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="card-bottom-actions">
                                    <button className="action-btn primary" onClick={() => handleViewDetails(project)}>
                                        <Eye size={16} />
                                        View Details
                                    </button>
                                    <button className="action-btn secondary">
                                        <Edit size={16} />
                                        Edit
                                    </button>
                                    <button className="action-btn danger">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                    <div className="modern-pagination">
                        <div className="pagination-info">
                            <span>Showing</span>
                            <strong>{((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredProjects.length)}</strong>
                            <span>of</span>
                            <strong>{filteredProjects.length}</strong>
                            <span>projects</span>
                        </div>
                        <div className="pagination-controls">
                            <button 
                                className="pagination-btn prev"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(currentPage - 1)}
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>
                            
                            <div className="page-numbers">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let page;
                                    if (totalPages <= 5) {
                                        page = i + 1;
                                    } else if (currentPage <= 3) {
                                        page = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        page = totalPages - 4 + i;
                                    } else {
                                        page = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <button
                                            key={page}
                                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <button 
                                className="pagination-btn next"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(currentPage + 1)}
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {filteredProjects.length === 0 && (
                    <div className="modern-empty-state">
                        <div className="empty-illustration">
                            <FolderOpen size={64} />
                        </div>
                        <h3>No projects found</h3>
                        <p>Try adjusting your search criteria or create a new project to get started</p>
                        <button className="empty-action-btn" onClick={handleAddProject}>
                            <Plus size={18} />
                            Create Your First Project
                        </button>
                    </div>
                )}
            </div>

            {/* Enhanced Modals */}
            {showModal && (
                <div className="modern-modal-overlay">
                    <div className="modern-modal">
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="close-btn" onClick={closeModal}>
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="coming-soon">
                                <h3>🚧 Coming Soon</h3>
                                <p>Advanced project creation form with all the modern features is being developed.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showKanban && (
                <div className="modern-modal-overlay">
                    <div className="modern-modal large">
                        <div className="modal-header">
                            <h2>Project Management Board</h2>
                            <button className="close-btn" onClick={() => setShowKanban(false)}>
                                <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="coming-soon">
                                <h3>🎯 Advanced Kanban Board</h3>
                                <p>Interactive project management board with drag-and-drop functionality is coming soon.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
