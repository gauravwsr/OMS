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
  AreaChart,
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
    loading: true,
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
    if (user && user.role === "Super_Admin") {
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

      const quotationsResponse = await axios.get(
        `${API_BASE_URL}/newquotations`
      );
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
        month: new Date(yearNumber, month).toLocaleDateString("en-US", {
          month: "short",
        }),
        revenue: 0,
        expenses: 0,
        profit: 0,
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
    monthlyData.forEach((data) => {
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
      const response = await fetch(
        "http://localhost:5001/api/client-projects",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const projects = result.data || [];

        const summary = {
          totalProjects: projects.length,
          activeProjects: projects.filter((p) => p.projectStatus === "Active")
            .length,
          completedProjects: projects.filter(
            (p) => p.projectStatus === "Completed"
          ).length,
          overdueProjects: projects.filter((p) => p.projectStatus === "Overdue")
            .length,
          totalProjectValue: projects.reduce(
            (sum, p) => sum + (p.finalAmount || 0),
            0
          ),
          loading: false,
        };

        setProjectSummary(summary);
      }
    } catch (error) {
      console.error("Error fetching project summary:", error);
      setProjectSummary((prev) => ({ ...prev, loading: false }));
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
    console.log("Fetching upcoming events...");
    try {
      const response = await axios.post("http://localhost:5001/GetData");
      console.log("Events API response:", response.data);
      const allEvents = response.data || [];
      console.log("All events fetched:", allEvents);

      // Filter upcoming events (events that haven't ended yet)
      const now = new Date();
      console.log("Current date and time:", now);

      const upcoming = allEvents
        .filter((event) => {
          const eventEnd = new Date(event.EndTime);
          const eventStart = new Date(event.StartTime);
          console.log("Event:", event.Subject);
          console.log("Event start time:", eventStart);
          console.log("Event end time:", eventEnd);
          console.log("Is event still active or upcoming?", eventEnd >= now);
          return eventEnd >= now; // Include events that haven't ended yet
        })
        .sort((a, b) => new Date(a.StartTime) - new Date(b.StartTime)) // Sort by start time
        .slice(0, 5); // Show only next 5 events

      console.log("Filtered upcoming events:", upcoming);
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
      return `🔴 Ongoing - Ends ${endDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Check if event starts today
    if (startDate.toDateString() === today.toDateString()) {
      return `Today, ${startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Check if event starts tomorrow
    if (startDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Other dates
    return startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
    teal: "#14b8a6",
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num >= 10000000) return (num / 10000000).toFixed(1) + "Cr";
    if (num >= 100000) return (num / 100000).toFixed(1) + "L";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <>
      <NotificationPopup />

      {/* Show NotificationPopup only for Super Admin */}
      {user?.role === "Super_Admin" && <NotificationPopup />}

      <div className="dashboard-container">
        {/* FIRST ROW: Financial Performance Summary - Full Width */}
        <div className="grid-row financial-row">
          {/* TotalRevenue Section */}
          <div className="finance-container">
            <h2 className="finance-title">Financial Performance Summary</h2>

            <div className="year-selector">
              <label className="year-label">Select Year: </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="year-select"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="card-container">
              <div className="finance-card">
                <div className="card-header">
                  <h3 className="card-title">Total Revenue</h3>
                </div>
                <div className="card-body revenue-bg">
                  <p className="card-value">
                    ₹{financialData.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Expenses card with click handler */}
              <div
                className="finance-card clickable"
                onClick={handleOpenExpensesChart}
                title="Click to view detailed expense breakdown"
              >
                <div className="card-header">
                  <h3 className="card-title">Total Expenses</h3>
                </div>
                <div className="card-body expenses-bg">
                  <p className="card-value">
                    ₹{financialData.totalExpenses.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="finance-card">
                <div className="card-header">
                  <h3 className="card-title">
                    {financialData.profit >= 0 ? "Profit" : "Loss"}
                  </h3>
                </div>
                <div
                  className={`card-body ${
                    financialData.profit >= 0 ? "profit-bg" : "loss-bg"
                  }`}
                >
                  <p
                    className="card-value"
                    style={{ color: getStatusColor(financialData.profit) }}
                  >
                    ₹{Math.abs(financialData.profit).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="finance-card">
                <div className="card-header">
                  <h3 className="card-title">Profit Margin</h3>
                </div>
                <div
                  className={`card-body ${
                    financialData.profit >= 0 ? "profit-bg" : "loss-bg"
                  }`}
                >
                  <p
                    className="card-value"
                    style={{ color: getStatusColor(financialData.profit) }}
                  >
                    {financialData.profitPercentage}%
                  </p>
                </div>
              </div>
            </div>

            <div className="finance-summary">
              <h3 className="summary-title">
                Financial Summary for {selectedYear}
              </h3>
              <p className="summary-text">
                In {selectedYear}, the total revenue generated was{" "}
                <strong>₹{financialData.totalRevenue.toLocaleString()}</strong>{" "}
                against total expenses of{" "}
                <strong>₹{financialData.totalExpenses.toLocaleString()}</strong>
                , resulting in a {financialData.profit >= 0 ? "profit" : "loss"}{" "}
                of{" "}
                <strong style={{ color: getStatusColor(financialData.profit) }}>
                  ₹{Math.abs(financialData.profit).toLocaleString()}
                </strong>{" "}
                with a profit margin of
                <strong style={{ color: getStatusColor(financialData.profit) }}>
                  {" "}
                  {financialData.profitPercentage}%
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        {/* SECOND ROW: Task Progress, Deals Overview, and Quotations all in one row */}
        <div className="grid-row-three-cols">
          {/* TaskProgress Section */}
          <div className="task-progress-container">
            <h3 className="section-title">Task Progress</h3>

            {tasksLoading ? (
              <p className="loading-text">Loading task data...</p>
            ) : tasksError ? (
              <p className="error-text">Error loading tasks: {tasksError}</p>
            ) : !hasTaskData ? (
              <div className="no-data-container">
                <p className="no-data-text">No TASKs Assigned</p>
              </div>
            ) : (
              <div className="chart-container">
                <PieChart width={220} height={220} className="pie-chart">
                  <Pie
                    data={taskData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {taskData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </div>
            )}
          </div>

          {/* Deals Statistics Section */}
          <div className="deals-overview-container">
            <h3 className="section-title">Deals Overview</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Count</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="table-cell">Total Deals</td>
                    <td className="table-cell">{dealsStats.totalDeals}</td>
                  </tr>
                  <tr>
                    <td className="table-cell">Contacted Deals</td>
                    <td className="table-cell">{dealsStats.contactedDeals}</td>
                  </tr>
                  <tr>
                    <td className="table-cell">Qualified Deals</td>
                    <td className="table-cell">{dealsStats.qualifiedDeals}</td>
                  </tr>
                  <tr>
                    <td className="table-cell">Proposals Accepted</td>
                    <td className="table-cell">
                      {dealsStats.proposalsAccepted}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Saved Quotations Section */}
          <div className="quotations-container">
            <h3 className="section-title">Saved Quotations</h3>
            {savedQuotations.length === 0 ? (
              <p className="no-data-text">No saved quotations available</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead className="sticky-header">
                    <tr>
                      <th className="table-header-cell">Client Name</th>
                      <th className="table-header-cell">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedQuotations.map((quotation, index) => (
                      <tr key={index}>
                        <td className="table-cell">{quotation.clientName}</td>
                        <td className="table-cell">₹{quotation.Totalamount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="activity-section">
          <div className="section-header">
            <h3>Upcoming Events</h3>
          </div>

          {eventsLoading ? (
            <div className="activity-timeline">
              <div className="timeline-item">
                <div className="timeline-icon notification">⏳</div>
                <div className="timeline-content">
                  <h4>Loading Events</h4>
                  <p>Please wait while we fetch your events...</p>
                  <span className="timeline-time">Just now</span>
                </div>
              </div>
            </div>
          ) : eventsError ? (
            <div className="activity-timeline">
              <div className="timeline-item">
                <div className="timeline-icon notification">❌</div>
                <div className="timeline-content">
                  <h4>Error Loading Events</h4>
                  <p>Unable to fetch upcoming events</p>
                  <span className="timeline-time">Just now</span>
                </div>
              </div>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="activity-timeline">
              <div className="timeline-item">
                <div className="timeline-icon notification">📅</div>
                <div className="timeline-content">
                  <h4>No Upcoming Events</h4>
                  <p>No events scheduled for today</p>
                  <span className="timeline-time">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="activity-timeline">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="timeline-item">
                  <div className="timeline-icon notification">📅</div>
                  <div className="timeline-content">
                    <h4>{event.Subject}</h4>
                    <p>{event.Description || "Event scheduled"}</p>
                    <span className="timeline-time">
                      {formatEventDate(event.StartTime, event.EndTime)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses Chart Modal */}
        {showExpensesChart && (
          <div className="modal">
            <div className="modal-content">
              <span
                className="close-button"
                onClick={handleCloseExpensesChart}
                title="Close"
              >
                &times;
              </span>
              <h3 className="modal-title">
                Expenses Breakdown for {selectedYear}
              </h3>
              <div className="modal-chart-container">
                {/* Here you would place your expenses chart component */}
                <p className="centered-text">
                  Detailed expenses chart would be displayed here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDashboard;
