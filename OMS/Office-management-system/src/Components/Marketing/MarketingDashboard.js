import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiTarget, 
  FiTrendingUp, 
  FiUsers, 
  FiEye, 
  FiMail, 
  FiShare2,
  FiBarChart3,
  FiCalendar,
  FiAward,
  FiGlobe
} from 'react-icons/fi';
import './MarketingDashboard.css';

const MarketingDashboard = () => {
  const [campaignStats, setCampaignStats] = useState({
    activeCampaigns: 0,
    totalReach: 0,
    conversionRate: 0,
    emailOpened: 0
  });
  const [campaigns, setCampaigns] = useState([]);
  const [socialMedia, setSocialMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost5001/api';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock marketing data
      setCampaignStats({
        activeCampaigns: 8,
        totalReach: 125000,
        conversionRate: 3.2,
        emailOpened: 67
      });

      setCampaigns([
        { 
          id: 1, 
          name: 'Summer Product Launch', 
          status: 'active', 
          budget: 15000, 
          spent: 8500, 
          reach: 45000,
          conversion: 2.8,
          startDate: '2025-01-15',
          endDate: '2025-02-15'
        },
        { 
          id: 2, 
          name: 'Brand Awareness Q1', 
          status: 'active', 
          budget: 25000, 
          spent: 18200, 
          reach: 78000,
          conversion: 4.1,
          startDate: '2025-01-01',
          endDate: '2025-03-31'
        },
        { 
          id: 3, 
          name: 'Holiday Promotion', 
          status: 'completed', 
          budget: 20000, 
          spent: 19800, 
          reach: 95000,
          conversion: 5.2,
          startDate: '2024-12-01',
          endDate: '2024-12-31'
        },
        { 
          id: 4, 
          name: 'Email Newsletter Campaign', 
          status: 'planning', 
          budget: 5000, 
          spent: 0, 
          reach: 0,
          conversion: 0,
          startDate: '2025-02-01',
          endDate: '2025-02-28'
        },
      ]);

      setSocialMedia([
        { platform: 'Facebook', followers: 12500, engagement: 4.2, posts: 24, growth: '+15%' },
        { platform: 'Instagram', followers: 8200, engagement: 6.8, posts: 31, growth: '+22%' },
        { platform: 'Twitter', followers: 5400, engagement: 2.1, posts: 18, growth: '+8%' },
        { platform: 'LinkedIn', followers: 3100, engagement: 3.5, posts: 12, growth: '+12%' },
      ]);

    } catch (error) {
      console.error('Error fetching marketing dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend, trendValue }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {trend && (
          <div className={`stat-trend ${trend}`}>
            <FiTrendingUp size={12} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return '#27ae60';
      case 'completed': return '#3498db';
      case 'planning': return '#f39c12';
      case 'paused': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="marketing-dashboard">
      <div className="dashboard-header">
        <h1>Marketing Department Dashboard</h1>
        <p>Track campaigns, analyze performance, and drive growth</p>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading Marketing Dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon={FiTarget}
              title="Active Campaigns"
              value={campaignStats.activeCampaigns}
              color="#e74c3c"
              trend="up"
              trendValue="+2 this month"
            />
            <StatCard
              icon={FiEye}
              title="Total Reach"
              value={formatNumber(campaignStats.totalReach)}
              color="#3498db"
              trend="up"
              trendValue="+25% this month"
            />
            <StatCard
              icon={FiBarChart3}
              title="Conversion Rate"
              value={`${campaignStats.conversionRate}%`}
              color="#27ae60"
              trend="up"
              trendValue="+0.8% this month"
            />
            <StatCard
              icon={FiMail}
              title="Email Open Rate"
              value={`${campaignStats.emailOpened}%`}
              color="#9b59b6"
              trend="up"
              trendValue="+12% this month"
            />
          </div>

          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiTarget /> Active Campaigns</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="campaigns-grid">
                {campaigns.filter(c => c.status === 'active').map(campaign => (
                  <div key={campaign.id} className="campaign-card">
                    <div className="campaign-header">
                      <h4>{campaign.name}</h4>
                      <span 
                        className="campaign-status"
                        style={{ backgroundColor: getStatusColor(campaign.status) }}
                      >
                        {campaign.status}
                      </span>
                    </div>
                    <div className="campaign-metrics">
                      <div className="metric-row">
                        <span>Budget:</span>
                        <span>${campaign.budget.toLocaleString()}</span>
                      </div>
                      <div className="metric-row">
                        <span>Spent:</span>
                        <span>${campaign.spent.toLocaleString()}</span>
                      </div>
                      <div className="metric-row">
                        <span>Reach:</span>
                        <span>{formatNumber(campaign.reach)}</span>
                      </div>
                      <div className="metric-row">
                        <span>Conversion:</span>
                        <span>{campaign.conversion}%</span>
                      </div>
                    </div>
                    <div className="campaign-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {Math.round((campaign.spent / campaign.budget) * 100)}% budget used
                      </span>
                    </div>
                    <div className="campaign-actions">
                      <button className="action-btn primary">View Details</button>
                      <button className="action-btn">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiShare2 /> Social Media Performance</h2>
                <button className="view-all-btn">Analytics</button>
              </div>
              <div className="social-media-grid">
                {socialMedia.map((platform, index) => (
                  <div key={index} className="social-card">
                    <div className="social-header">
                      <h4>{platform.platform}</h4>
                      <span className="growth-indicator positive">
                        {platform.growth}
                      </span>
                    </div>
                    <div className="social-metrics">
                      <div className="social-metric">
                        <FiUsers className="metric-icon" />
                        <div>
                          <span className="metric-value">{formatNumber(platform.followers)}</span>
                          <span className="metric-label">Followers</span>
                        </div>
                      </div>
                      <div className="social-metric">
                        <FiBarChart3 className="metric-icon" />
                        <div>
                          <span className="metric-value">{platform.engagement}%</span>
                          <span className="metric-label">Engagement</span>
                        </div>
                      </div>
                      <div className="social-metric">
                        <FiCalendar className="metric-icon" />
                        <div>
                          <span className="metric-value">{platform.posts}</span>
                          <span className="metric-label">Posts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiAward /> Quick Actions</h2>
              </div>
              <div className="quick-actions">
                <div className="action-card">
                  <FiTarget size={32} />
                  <h3>Create Campaign</h3>
                  <p>Launch a new marketing campaign</p>
                  <button className="action-card-btn">Create</button>
                </div>
                <div className="action-card">
                  <FiMail size={32} />
                  <h3>Email Campaign</h3>
                  <p>Send targeted email campaigns</p>
                  <button className="action-card-btn">Send Email</button>
                </div>
                <div className="action-card">
                  <FiBarChart3 size={32} />
                  <h3>Analytics Report</h3>
                  <p>Generate performance reports</p>
                  <button className="action-card-btn">Generate</button>
                </div>
                <div className="action-card">
                  <FiGlobe size={32} />
                  <h3>Content Calendar</h3>
                  <p>Plan and schedule content</p>
                  <button className="action-card-btn">Plan Content</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketingDashboard;
