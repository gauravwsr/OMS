import React, { useState, useEffect } from 'react';
import { 
  FaDollarSign, 
  FaChartLine, 
  FaUsers, 
  FaHandshake, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaCalendarAlt, 
  FaTasks,
  FaUserTie,
  FaArrowUp,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus
} from 'react-icons/fa';
import './SalesDashboard.css';

const SalesDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    activeLeads: 0,
    dealsWon: 0,
    conversionRate: 0,
    leads: [],
    recentDeals: [],
    salesTeam: [],
    activities: []
  });

  // Mock API call
  useEffect(() => {
    const fetchSalesData = async () => {
      // Simulate API call
      setTimeout(() => {
        setSalesData({
          totalRevenue: 1250000,
          activeLeads: 156,
          dealsWon: 24,
          conversionRate: 15.4,
          leads: [
            {
              id: 1,
              name: 'TechCorp Solutions',
              value: 45000,
              stage: 'Negotiation',
              probability: 75,
              contact: 'John Smith',
              phone: '+1 234-567-8901',
              email: 'john@techcorp.com',
              nextActivity: '2024-01-15',
              source: 'Website'
            },
            {
              id: 2,
              name: 'Global Industries',
              value: 32000,
              stage: 'Proposal',
              probability: 60,
              contact: 'Sarah Johnson',
              phone: '+1 234-567-8902',
              email: 'sarah@global.com',
              nextActivity: '2024-01-14',
              source: 'Referral'
            },
            {
              id: 3,
              name: 'StartupXYZ',
              value: 18000,
              stage: 'Qualification',
              probability: 40,
              contact: 'Mike Chen',
              phone: '+1 234-567-8903',
              email: 'mike@startupxyz.com',
              nextActivity: '2024-01-16',
              source: 'Cold Call'
            },
            {
              id: 4,
              name: 'Enterprise Co',
              value: 67000,
              stage: 'Demo',
              probability: 85,
              contact: 'Lisa Davis',
              phone: '+1 234-567-8904',
              email: 'lisa@enterprise.com',
              nextActivity: '2024-01-13',
              source: 'LinkedIn'
            }
          ],
          recentDeals: [
            {
              id: 1,
              client: 'MegaCorp Inc',
              value: 75000,
              closedDate: '2024-01-10',
              salesperson: 'Alex Thompson'
            },
            {
              id: 2,
              client: 'Innovation Labs',
              value: 42000,
              closedDate: '2024-01-08',
              salesperson: 'Emma Wilson'
            },
            {
              id: 3,
              client: 'Future Tech',
              value: 28000,
              closedDate: '2024-01-05',
              salesperson: 'David Brown'
            }
          ],
          salesTeam: [
            {
              id: 1,
              name: 'Alex Thompson',
              target: 500000,
              achieved: 425000,
              deals: 18,
              performance: 85
            },
            {
              id: 2,
              name: 'Emma Wilson',
              target: 450000,
              achieved: 398000,
              deals: 16,
              performance: 88
            },
            {
              id: 3,
              name: 'David Brown',
              target: 400000,
              achieved: 352000,
              deals: 14,
              performance: 88
            },
            {
              id: 4,
              name: 'Sofia Garcia',
              target: 350000,
              achieved: 298000,
              deals: 12,
              performance: 85
            }
          ],
          activities: [
            {
              id: 1,
              type: 'call',
              title: 'Follow-up call with TechCorp',
              time: '10:00 AM',
              date: '2024-01-15',
              priority: 'high'
            },
            {
              id: 2,
              type: 'email',
              title: 'Send proposal to Global Industries',
              time: '2:00 PM',
              date: '2024-01-14',
              priority: 'medium'
            },
            {
              id: 3,
              type: 'meeting',
              title: 'Demo presentation for Enterprise Co',
              time: '11:00 AM',
              date: '2024-01-13',
              priority: 'high'
            },
            {
              id: 4,
              type: 'task',
              title: 'Prepare contract for StartupXYZ',
              time: '9:00 AM',
              date: '2024-01-16',
              priority: 'low'
            }
          ]
        });
        setLoading(false);
      }, 1000);
    };

    fetchSalesData();
  }, []);

  const getStageColor = (stage) => {
    const colors = {
      'Qualification': '#94a3b8',
      'Demo': '#3b82f6',
      'Proposal': '#f59e0b',
      'Negotiation': '#ef4444',
      'Closed Won': '#10b981'
    };
    return colors[stage] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  const getActivityIcon = (type) => {
    const icons = {
      'call': <FaPhoneAlt />,
      'email': <FaEnvelope />,
      'meeting': <FaCalendarAlt />,
      'task': <FaTasks />
    };
    return icons[type] || <FaTasks />;
  };

  if (loading) {
    return (
      <div className="sales-dashboard">
        <div className="loading-spinner">
          Loading Sales Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="sales-dashboard">
      <div className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <p>Track leads, manage deals, and monitor sales performance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FaDollarSign size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">${salesData.totalRevenue.toLocaleString()}</div>
            <div className="stat-title">Total Revenue</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +12.5% from last month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <FaUsers size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{salesData.activeLeads}</div>
            <div className="stat-title">Active Leads</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +8.3% from last week
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <FaHandshake size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{salesData.dealsWon}</div>
            <div className="stat-title">Deals Won</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +5 this month
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <FaChartLine size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{salesData.conversionRate}%</div>
            <div className="stat-title">Conversion Rate</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              +2.1% improvement
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaUsers /> Active Leads</h2>
            <button className="view-all-btn">
              <FaPlus /> Add New Lead
            </button>
          </div>
          <div className="leads-table">
            <div className="table-header">
              <div>Company</div>
              <div>Contact</div>
              <div>Value</div>
              <div>Stage</div>
              <div>Probability</div>
              <div>Next Activity</div>
              <div>Actions</div>
            </div>
            {salesData.leads.map(lead => (
              <div key={lead.id} className="table-row">
                <div className="lead-company">
                  <div className="company-name">{lead.name}</div>
                  <div className="lead-source">{lead.source}</div>
                </div>
                <div className="lead-contact">
                  <div className="contact-name">{lead.contact}</div>
                  <div className="contact-info">
                    <span>{lead.phone}</span>
                    <span>{lead.email}</span>
                  </div>
                </div>
                <div className="lead-value">
                  ${lead.value.toLocaleString()}
                </div>
                <div className="lead-stage">
                  <span 
                    className="stage-badge" 
                    style={{ backgroundColor: getStageColor(lead.stage) }}
                  >
                    {lead.stage}
                  </span>
                </div>
                <div className="lead-probability">
                  <div className="probability-bar">
                    <div 
                      className="probability-fill" 
                      style={{ width: `${lead.probability}%` }}
                    ></div>
                  </div>
                  <span>{lead.probability}%</span>
                </div>
                <div className="next-activity">
                  {lead.nextActivity}
                </div>
                <div className="lead-actions">
                  <button className="action-btn"><FaEye /></button>
                  <button className="action-btn"><FaEdit /></button>
                  <button className="action-btn danger"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaHandshake /> Recent Deals</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="deals-grid">
            {salesData.recentDeals.map(deal => (
              <div key={deal.id} className="deal-card">
                <div className="deal-header">
                  <h4>{deal.client}</h4>
                  <div className="deal-value">${deal.value.toLocaleString()}</div>
                </div>
                <div className="deal-info">
                  <div className="deal-detail">
                    <span>Closed Date:</span>
                    <span>{deal.closedDate}</span>
                  </div>
                  <div className="deal-detail">
                    <span>Salesperson:</span>
                    <span>{deal.salesperson}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaUserTie /> Sales Team Performance</h2>
            <button className="view-all-btn">View Details</button>
          </div>
          <div className="team-grid">
            {salesData.salesTeam.map(member => (
              <div key={member.id} className="team-card">
                <div className="member-header">
                  <h4>{member.name}</h4>
                  <div className="performance-score">{member.performance}%</div>
                </div>
                <div className="member-stats">
                  <div className="stat-row">
                    <span>Target:</span>
                    <span>${member.target.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span>Achieved:</span>
                    <span>${member.achieved.toLocaleString()}</span>
                  </div>
                  <div className="stat-row">
                    <span>Deals Closed:</span>
                    <span>{member.deals}</span>
                  </div>
                </div>
                <div className="progress-section">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(member.achieved / member.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {Math.round((member.achieved / member.target) * 100)}% of target
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2><FaCalendarAlt /> Upcoming Activities</h2>
            <button className="view-all-btn">View Calendar</button>
          </div>
          <div className="activities-list">
            {salesData.activities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="activity-info">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.date} at {activity.time}</div>
                </div>
                <div className="activity-priority">
                  <span 
                    className="priority-badge" 
                    style={{ backgroundColor: getPriorityColor(activity.priority) }}
                  >
                    {activity.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDashboard;
