import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import NotificationPopup from "./Components/NotificationPopup/NotificationPopup";
import { useAuth } from "./Components/AuthProvider/AuthContext";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, notifications, fetchNotifications } = useAuth();
  
  // TopDeals states
  const [topDeals, setTopDeals] = useState([]);
  const [dealsStats, setDealsStats] = useState({
    totalDeals: 0,
    contactedDeals: 0,
    qualifiedDeals: 0,
    proposalsAccepted: 0,
  });
  const [savedQuotations, setSavedQuotations] = useState([]);

  // TotalRevenue states
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    profitPercentage: 0,
    loading: true,
    error: null,
  });
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [availableYears, setAvailableYears] = useState([]);
  const [monthlyFinancialData, setMonthlyFinancialData] = useState([]);

  const [showExpensesChart, setShowExpensesChart] = useState(false);

  // MeetingNotifications states
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [meetingsError, setMeetingsError] = useState(null);

  // TaskProgress states
  const [taskData, setTaskData] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);

  // Upcoming Events states
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  // Project summary states
  const [projectSummary, setProjectSummary] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    totalProjectValue: 0,
    loading: true
  });

  const API_BASE_URL = "https://crm-brown-gamma.vercel.app/api";

  useEffect(() => {
    // Fetch all data on component mount
    fetchTopDeals();
    fetchDealsStats();
    fetchSavedQuotations();
    fetchFinancialData();
    fetchMeetings();
    fetchTasks();
    fetchUpcomingEvents();
    fetchProjectSummary();

    // Set up auto-refresh for upcoming events every 5 minutes
    const eventsInterval = setInterval(fetchUpcomingEvents, 5 * 60 * 1000);

    return () => {
      clearInterval(eventsInterval);
    };
  }, []);

  // Fetch notifications when component mounts and user is available
  useEffect(() => {
    if (user && user.role === 'Super_Admin') {
      // Clean up test notifications on Super Admin login
      cleanupTestNotifications();
      // Then fetch fresh notifications
      setTimeout(() => {
        if (fetchNotifications) {
          fetchNotifications();
        }
      }, 1000);
    }
  }, [user]);

  // Clean up test notifications
  const cleanupTestNotifications = async () => {
    try {
      await axios.delete(
        "http://localhost:5001/api/notifications/cleanup-test",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Fetch fresh notifications after cleanup
      setTimeout(() => {
        if (fetchNotifications) {
          fetchNotifications();
        }
      }, 500);
    } catch (error) {
      console.error("Error cleaning up test notifications:", error);
    }
  };

  useEffect(() => {
    // Refetch financial data when selected year changes
    if (availableYears.length > 0) {
      fetchFinancialData();
    }
  }, [selectedYear]);

  // TopDeals functions
  const fetchTopDeals = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dealmanagement`);
      setTopDeals(response.data);
    } catch (error) {
      console.error("Error fetching top deals:", error);
    }
  };

  const fetchDealsStats = async () => {
    try {
      const dealsResponse = await axios.get(`${API_BASE_URL}/dealmanagement`);
      const deals = dealsResponse.data;

      const filteredDeals = deals.filter((deal) => deal.stage !== "Proposal");

      const contactedDeals = filteredDeals.filter(
        (deal) => deal.stage === "Contacted"
      ).length;
      const qualifiedDeals = filteredDeals.filter(
        (deal) => deal.stage === "Qualified"
      ).length;

      const quotationsResponse = await axios.get(`${API_BASE_URL}/newquotations`);
      const quotations = quotationsResponse.data;

      const totalDeals = filteredDeals.length + quotations.length;
      const proposalsAccepted = quotations.length;

      setDealsStats({
        totalDeals,
        contactedDeals,
        qualifiedDeals,
        proposalsAccepted,
      });
    } catch (error) {
      console.error("Error fetching deals statistics:", error);
    }
  };

  const fetchSavedQuotations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/newquotations`);
      setSavedQuotations(response.data);
    } catch (error) {
      console.error("Error fetching saved quotations:", error);
    }
  };

  // TotalRevenue functions
  const fetchFinancialData = async () => {
    try {
      // Fetch revenue data
      const revenueResponse = await axios.get(`${API_BASE_URL}/financeDetails`);
      const revenueData = revenueResponse.data;

      const serviceResponse = await fetch(`${API_BASE_URL}/integrations`);
      const serviceData = await serviceResponse.json();
      const services = serviceData.data || [];

      // Extract all available years from both datasets
      const revenueYears = [
        ...new Set(
          revenueData.flatMap((finance) => {
            const years = [];
            const paymentDates = [
              finance.paymentDate?.advancedPDate,
              finance.paymentDate?.midPDate,
              finance.paymentDate?.finalPDate,
            ];

            paymentDates.forEach((date) => {
              if (date) {
                years.push(new Date(date).getFullYear());
              }
            });

            return years;
          })
        ),
      ];

      const expenseYears = [
        ...new Set([
          ...services.flatMap((provider) =>
            provider.services.map((service) =>
              new Date(service.buyDate).getFullYear()
            )
          ),
          ...services.flatMap((provider) =>
            provider.services.flatMap((service) =>
              service.renewalHistory.map((renewal) =>
                new Date(renewal.renewalDate).getFullYear()
              )
            )
          ),
        ]),
      ].filter(Boolean);

      const allYears = [...new Set([...revenueYears, ...expenseYears])].sort(
        (a, b) => b - a
      );
      setAvailableYears(allYears);

      // If no year is selected yet, set to most recent year
      if (allYears.length > 0 && !selectedYear) {
        setSelectedYear(allYears[0].toString());
      }

      calculateFinancials(revenueData, services, selectedYear);
    } catch (error) {
      console.error("Error fetching financial data:", error);
      setFinancialData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load financial data",
      }));
    }
  };

  const calculateFinancials = (revenueData, services, year) => {
    const yearNumber = parseInt(year);

    // Initialize monthly data structure
    const monthlyData = [];
    for (let month = 0; month < 12; month++) {
      monthlyData.push({
        month: new Date(yearNumber, month).toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
        expenses: 0,
        profit: 0
      });
    }

    // Calculate total revenue for selected year
    let totalRevenue = 0;
    revenueData.forEach((finance) => {
      const paymentDates = [
        finance.paymentDate?.advancedPDate,
        finance.paymentDate?.midPDate,
        finance.paymentDate?.finalPDate,
      ];

      const payments = [
        finance.advancePayment || 0,
        finance.midPayment || 0,
        finance.finalPayment || 0,
      ];

      paymentDates.forEach((date, index) => {
        if (date && new Date(date).getFullYear() === yearNumber) {
          const month = new Date(date).getMonth();
          totalRevenue += payments[index];
          monthlyData[month].revenue += payments[index];
        }
      });
    });

    // Calculate total expenses for selected year
    // 1. Service purchases
    const totalServiceCost = services
      .flatMap((provider) =>
        provider.services.filter(
          (service) => new Date(service.buyDate).getFullYear() === yearNumber
        )
      )
      .reduce((sum, service) => {
        const month = new Date(service.buyDate).getMonth();
        monthlyData[month].expenses += service.serviceCost;
        return sum + service.serviceCost;
      }, 0);

    // 2. Service renewals
    const totalRenewalCost = services
      .flatMap((provider) =>
        provider.services.flatMap((service) =>
          service.renewalHistory.filter(
            (renewal) =>
              new Date(renewal.renewalDate).getFullYear() === yearNumber
          )
        )
      )
      .reduce((sum, renewal) => {
        const month = new Date(renewal.renewalDate).getMonth();
        monthlyData[month].expenses += renewal.renewalCost;
        return sum + renewal.renewalCost;
      }, 0);

    // Calculate monthly profits
    monthlyData.forEach(data => {
      data.profit = data.revenue - data.expenses;
    });

    const totalExpenses = totalServiceCost + totalRenewalCost;
    const profit = totalRevenue - totalExpenses;
    const profitPercentage =
      totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0;

    setFinancialData({
      totalRevenue,
      totalExpenses,
      profit,
      profitPercentage,
      loading: false,
      error: null,
    });

    setMonthlyFinancialData(monthlyData);
  };

  const getStatusColor = (profit) => {
    return profit >= 0 ? "#4CAF50" : "#F44336";
  };

  const handleOpenExpensesChart = () => {
    setShowExpensesChart(true);
  };

  const handleCloseExpensesChart = () => {
    setShowExpensesChart(false);
  };

  // Fetch project summary data
  const fetchProjectSummary = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/client-projects", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        const projects = result.data || [];
        
        const summary = {
          totalProjects: projects.length,
          activeProjects: projects.filter(p => p.projectStatus === 'Active').length,
          completedProjects: projects.filter(p => p.projectStatus === 'Completed').length,
          overdueProjects: projects.filter(p => p.projectStatus === 'Overdue').length,
          totalProjectValue: projects.reduce((sum, p) => sum + (p.finalAmount || 0), 0),
          loading: false
        };
        
        setProjectSummary(summary);
      }
    } catch (error) {
      console.error("Error fetching project summary:", error);
      setProjectSummary(prev => ({ ...prev, loading: false }));
    }
  };

  // MeetingNotifications functions
  const fetchMeetings = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const todayFormatted = formatDate(today);
      const tomorrowFormatted = formatDate(tomorrow);

      const todayMeetings = await axios.get(
        `${API_BASE_URL}/meetings/${todayFormatted}`
      );
      const tomorrowMeetings = await axios.get(
        `${API_BASE_URL}/meetings/${tomorrowFormatted}`
      );

      setMeetings([
        {
          date: todayFormatted,
          events: todayMeetings.data.meetings || [],
          isTomorrow: false,
        },
        {
          date: tomorrowFormatted,
          events: tomorrowMeetings.data.meetings || [],
          isTomorrow: true,
        },
      ]);
    } catch (err) {
      if (err.response) {
        setMeetingsError(
          `Error: ${err.response.status} - ${
            err.response.data.message || "An error occurred"
          }`
        );
      } else {
        setMeetingsError(
          "Error fetching meetings. Please check your network connection."
        );
      }
    } finally {
      setMeetingsLoading(false);
    }
  };

  const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // TaskProgress functions
  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Newtasks`);
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      const data = await response.json();
      const tasks = data.tasks || [];
      
      // Categorize tasks based on status
      const taskCounts = {
        Open: 0,
        "In Progress": 0,
        "On Review": 0,
        Completed: 0,
      };

      tasks.forEach((task) => {
        if (taskCounts.hasOwnProperty(task.taskStatus)) {
          taskCounts[task.taskStatus] += 1;
        }
      });

      // Convert task counts to chart data format
      const chartData = Object.keys(taskCounts).map((status) => ({
        name: status,
        value: taskCounts[status],
      }));

      setTaskData(chartData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasksError(error.message);
    } finally {
      setTasksLoading(false);
    }
  };

  // Upcoming Events functions
  const fetchUpcomingEvents = async () => {
    setEventsLoading(true);
    console.log('Fetching upcoming events...');
    try {
      const response = await axios.post('http://localhost:5001/GetData');
      console.log('Events API response:', response.data);
      const allEvents = response.data || [];
      console.log('All events fetched:', allEvents);
      
      // Filter upcoming events (events that haven't ended yet)
      const now = new Date();
      console.log('Current date and time:', now);
      
      const upcoming = allEvents
        .filter(event => {
          const eventEnd = new Date(event.EndTime);
          const eventStart = new Date(event.StartTime);
          console.log('Event:', event.Subject);
          console.log('Event start time:', eventStart);
          console.log('Event end time:', eventEnd);
          console.log('Is event still active or upcoming?', eventEnd >= now);
          return eventEnd >= now; // Include events that haven't ended yet
        })
        .sort((a, b) => new Date(a.StartTime) - new Date(b.StartTime)) // Sort by start time
        .slice(0, 5); // Show only next 5 events
      
      console.log('Filtered upcoming events:', upcoming);
      setUpcomingEvents(upcoming);
      setEventsError(null);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
      setEventsError(error.message);
    } finally {
      setEventsLoading(false);
    }
  };

  // Helper function to format date for events
  const formatEventDate = (startTime, endTime) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if event is currently ongoing
    if (startDate <= now && endDate >= now) {
      return `🔴 Ongoing - Ends ${endDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Check if event starts today
    if (startDate.toDateString() === today.toDateString()) {
      return `Today, ${startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Check if event starts tomorrow
    if (startDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Other dates
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if there are actual tasks with values greater than 0
  const hasTaskData = taskData.some((item) => item.value > 0);
  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"]; // Colors for different statuses
  
  // Colors for charts
  const CHART_COLORS = {
    primary: "#3b82f6",
    secondary: "#10b981", 
    accent: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    teal: "#14b8a6"
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
    if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <>
      <NotificationPopup />
      {user?.role === 'Super_Admin' && <NotificationPopup />}
      
      <div className="modern-dashboard">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="dashboard-title">
                <span className="title-main">Super Admin Dashboard</span>
                <span className="title-subtitle">Complete Business Overview & Analytics</span>
              </h1>
              <div className="header-info">
                <span className="current-date">Today: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
            <div className="header-stats">
              <div className="quick-stat revenue-stat">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <span className="stat-value">{formatNumber(financialData.totalRevenue)}</span>
                  <span className="stat-label">Total Revenue</span>
                </div>
              </div>
              <div className="quick-stat projects-stat">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <span className="stat-value">{projectSummary.totalProjects}</span>
                  <span className="stat-label">Active Projects</span>
                </div>
              </div>
              <div className="quick-stat deals-stat">
                <div className="stat-icon">🤝</div>
                <div className="stat-content">
                  <span className="stat-value">{dealsStats.totalDeals}</span>
                  <span className="stat-label">Pipeline Deals</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Performance Section */}
        <div className="dashboard-section financial-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">
                <span className="section-icon">📊</span>
                Financial Performance
              </h2>
              <p className="section-description">Track revenue, expenses, and profitability metrics</p>
            </div>
            <div className="year-selector-modern">
              <label htmlFor="year-select">Financial Year:</label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="modern-select"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {financialData.loading ? (
            <div className="section-loading">
              <div className="loading-spinner"></div>
              <span>Loading financial data...</span>
            </div>
          ) : financialData.error ? (
            <div className="section-error">
              <span className="error-icon">⚠️</span>
              <span>{financialData.error}</span>
            </div>
          ) : (
            <div className="financial-grid">
              {/* Financial Cards */}
              <div className="financial-cards">
                <div className="finance-card modern revenue-card" data-trend="positive">
                  <div className="card-background"></div>
                  <div className="card-icon-wrapper">
                    <div className="card-icon">💰</div>
                  </div>
                  <div className="card-content">
                    <h3>Total Revenue</h3>
                    <p className="card-value">{formatCurrency(financialData.totalRevenue)}</p>
                    <div className="card-trend positive">
                      <span className="trend-icon">↗</span>
                      <span>Revenue for {selectedYear}</span>
                    </div>
                  </div>
                </div>

                <div className="finance-card modern expenses-card clickable" onClick={handleOpenExpensesChart} data-trend="neutral">
                  <div className="card-background"></div>
                  <div className="card-icon-wrapper">
                    <div className="card-icon">💸</div>
                  </div>
                  <div className="card-content">
                    <h3>Total Expenses</h3>
                    <p className="card-value">{formatCurrency(financialData.totalExpenses)}</p>
                    <div className="card-trend clickable-trend">
                      <span className="trend-icon">👆</span>
                      <span>Click for detailed breakdown</span>
                    </div>
                  </div>
                </div>

                <div className={`finance-card modern ${financialData.profit >= 0 ? 'profit-card' : 'loss-card'}`} 
                     data-trend={financialData.profit >= 0 ? 'positive' : 'negative'}>
                  <div className="card-background"></div>
                  <div className="card-icon-wrapper">
                    <div className="card-icon">{financialData.profit >= 0 ? '📈' : '📉'}</div>
                  </div>
                  <div className="card-content">
                    <h3>{financialData.profit >= 0 ? "Net Profit" : "Net Loss"}</h3>
                    <p className="card-value">{formatCurrency(Math.abs(financialData.profit))}</p>
                    <div className={`card-trend ${financialData.profit >= 0 ? 'positive' : 'negative'}`}>
                      <span className="trend-icon">{financialData.profit >= 0 ? '📊' : '📉'}</span>
                      <span>{financialData.profitPercentage}% profit margin</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Chart */}
              <div className="chart-container modern">
                <div className="chart-header">
                  <h3 className="chart-title">Monthly Financial Trends - {selectedYear}</h3>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <span className="legend-color revenue-color"></span>
                      <span>Revenue</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color expenses-color"></span>
                      <span>Expenses</span>
                    </div>
                  </div>
                </div>
                <div className="chart-content">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={monthlyFinancialData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip 
                        formatter={(value, name) => [formatCurrency(value), name]}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="Revenue"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="#ef4444"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorExpenses)"
                        name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Business Overview Grid */}
        <div className="business-overview-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">
                <span className="section-icon">📈</span>
                Business Analytics Dashboard
              </h2>
              <p className="section-description">Comprehensive overview of projects, tasks, deals, and quotations</p>
            </div>
          </div>
          
          <div className="business-overview-grid">
            
            {/* Project Summary */}
            <div className="overview-card project-summary-card">
              <div className="card-header">
                <h3>Project Portfolio</h3>
                <span className="card-icon">🎯</span>
              </div>
              <div className="card-body">
                {projectSummary.loading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <span>Loading project data...</span>
                  </div>
                ) : (
                  <>
                    <div className="project-stats-grid">
                      <div className="stat-item total-stat">
                        <span className="stat-number">{projectSummary.totalProjects}</span>
                        <span className="stat-label">Total Projects</span>
                        <div className="stat-indicator total"></div>
                      </div>
                      <div className="stat-item active-stat">
                        <span className="stat-number">{projectSummary.activeProjects}</span>
                        <span className="stat-label">Active</span>
                        <div className="stat-indicator active"></div>
                      </div>
                      <div className="stat-item completed-stat">
                        <span className="stat-number">{projectSummary.completedProjects}</span>
                        <span className="stat-label">Completed</span>
                        <div className="stat-indicator completed"></div>
                      </div>
                      <div className="stat-item overdue-stat">
                        <span className="stat-number">{projectSummary.overdueProjects}</span>
                        <span className="stat-label">Overdue</span>
                        <div className="stat-indicator overdue"></div>
                      </div>
                    </div>
                    <div className="project-value">
                      <span className="value-label">Total Portfolio Value</span>
                      <span className="value-amount">{formatCurrency(projectSummary.totalProjectValue)}</span>
                    </div>
                    
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Active', value: projectSummary.activeProjects, color: CHART_COLORS.primary },
                              { name: 'Completed', value: projectSummary.completedProjects, color: CHART_COLORS.secondary },
                              { name: 'Overdue', value: projectSummary.overdueProjects, color: CHART_COLORS.danger }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="value"
                            strokeWidth={2}
                            stroke="#fff"
                          >
                            {[
                              { name: 'Active', value: projectSummary.activeProjects, color: CHART_COLORS.primary },
                              { name: 'Completed', value: projectSummary.completedProjects, color: CHART_COLORS.secondary },
                              { name: 'Overdue', value: projectSummary.overdueProjects, color: CHART_COLORS.danger }
                            ].map((entry, index) => (
                              <Cell key={`project-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [value, 'Projects']}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </div>
            </div>

          {/* Task Progress */}
          <div className="overview-card task-progress-card">
            <div className="card-header">
              <h3>Task Management</h3>
              <span className="card-icon">✅</span>
            </div>
            <div className="card-body">
              {tasksLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <span>Loading task data...</span>
                </div>
              ) : tasksError ? (
                <div className="error-state">
                  <span className="error-icon">⚠️</span>
                  <span>Error loading tasks</span>
                </div>
              ) : !hasTaskData ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No tasks assigned yet</p>
                </div>
              ) : (
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={taskData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {taskData.map((entry, index) => (
                          <Cell key={`task-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, 'Tasks']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Deals Overview */}
          <div className="overview-card deals-overview-card">
            <div className="card-header">
              <h3>Sales Pipeline</h3>
              <span className="card-icon">🤝</span>
            </div>
            <div className="card-body">
              <div className="deals-chart">
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={[
                        { name: 'Total', value: dealsStats.totalDeals, color: CHART_COLORS.primary },
                        { name: 'Contacted', value: dealsStats.contactedDeals, color: CHART_COLORS.accent },
                        { name: 'Qualified', value: dealsStats.qualifiedDeals, color: CHART_COLORS.purple },
                        { name: 'Accepted', value: dealsStats.proposalsAccepted, color: CHART_COLORS.secondary }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="deals-summary">
                <div className="deal-stat">
                  <span className="deal-number">{dealsStats.totalDeals}</span>
                  <span className="deal-label">Total Pipeline</span>
                </div>
                <div className="deal-stat">
                  <span className="deal-number">{dealsStats.proposalsAccepted}</span>
                  <span className="deal-label">Converted</span>
                </div>
                <div className="deal-stat">
                  <span className="deal-number">
                    {dealsStats.totalDeals > 0 
                      ? Math.round((dealsStats.proposalsAccepted / dealsStats.totalDeals) * 100)
                      : 0}%
                  </span>
                  <span className="deal-label">Success Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Quotations */}
          <div className="overview-card quotations-card">
            <div className="card-header">
              <h3>Recent Quotations</h3>
              <span className="card-icon">📄</span>
            </div>
            <div className="card-body">
              {savedQuotations.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <p>No quotations available</p>
                </div>
              ) : (
                <div className="quotations-list">
                  {savedQuotations.slice(0, 5).map((quotation, index) => (
                    <div key={index} className="quotation-item">
                      <div className="quotation-details">
                        <div className="quotation-client">{quotation.clientName}</div>
                        <div className="quotation-date">
                          {new Date(quotation.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="quotation-amount">{formatCurrency(quotation.Totalamount)}</div>
                    </div>
                  ))}
                  {savedQuotations.length > 5 && (
                    <div className="quotations-more">
                      <span className="more-count">+{savedQuotations.length - 5}</span>
                      <span>more quotations</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="dashboard-section events-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2 className="section-title">
                <span className="section-icon">📅</span>
                Upcoming Events & Meetings
              </h2>
              <p className="section-description">Stay updated with your scheduled meetings and events</p>
            </div>
          </div>
          
          <div className="events-container">
            {eventsLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading upcoming events...</span>
              </div>
            ) : eventsError ? (
              <div className="section-error">
                <span className="error-icon">❌</span>
                <span>Error loading events: {eventsError}</span>
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📅</span>
                <p>No upcoming events scheduled</p>
              </div>
            ) : (
              <div className="events-timeline">
                {upcomingEvents.map((event) => (
                  <div key={event._id} className="event-item">
                    <div className="event-time">
                      <span className="event-date">{formatEventDate(event.StartTime, event.EndTime)}</span>
                    </div>
                    <div className="event-content">
                      <h4 className="event-title">{event.Subject}</h4>
                      <p className="event-description">{event.Description || "Event scheduled"}</p>
                      {event.Location && (
                        <p className="event-location">📍 {event.Location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expenses Chart Modal */}
        {showExpensesChart && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Monthly Expenses Breakdown - {selectedYear}</h3>
                <button className="modal-close" onClick={handleCloseExpensesChart}>×</button>
              </div>
              <div className="modal-body">
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={monthlyFinancialData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#d1d5db' }}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Expenses']}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="expenses" 
                        fill={CHART_COLORS.danger} 
                        name="Monthly Expenses"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;