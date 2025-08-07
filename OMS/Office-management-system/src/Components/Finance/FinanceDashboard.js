import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiCreditCard, 
  FiFileText, 
  FiPieChart,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle
} from 'react-icons/fi';
import './FinanceDashboard.css';

const FinanceDashboard = () => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    pendingInvoices: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost5001/api';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock financial data
      setFinancialData({
        totalRevenue: 485000,
        totalExpenses: 312000,
        netProfit: 173000,
        pendingInvoices: 12
      });

      setRecentTransactions([
        { id: 1, description: 'Project Payment - ABC Corp', amount: 25000, type: 'income', date: '2025-01-20', status: 'completed' },
        { id: 2, description: 'Office Rent', amount: -8000, type: 'expense', date: '2025-01-19', status: 'completed' },
        { id: 3, description: 'Software License', amount: -1200, type: 'expense', date: '2025-01-18', status: 'completed' },
        { id: 4, description: 'Client Retainer - XYZ Ltd', amount: 15000, type: 'income', date: '2025-01-17', status: 'pending' },
        { id: 5, description: 'Equipment Purchase', amount: -3500, type: 'expense', date: '2025-01-16', status: 'completed' },
      ]);

      setBudgetAnalysis([
        { department: 'HR', budgeted: 50000, actual: 42000, variance: 8000, status: 'under' },
        { department: 'IT', budgeted: 80000, actual: 85000, variance: -5000, status: 'over' },
        { department: 'Marketing', budgeted: 60000, actual: 58000, variance: 2000, status: 'under' },
        { department: 'Operations', budgeted: 100000, actual: 95000, variance: 5000, status: 'under' },
      ]);

    } catch (error) {
      console.error('Error fetching finance dashboard data:', error);
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
            {trend === 'up' ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  return (
    <div className="finance-dashboard">
      <div className="dashboard-header">
        <h1>Finance Department Dashboard</h1>
        <p>Monitor performance, budgets, and cash flow</p>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading Finance Dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon={FiDollarSign}
              title="Total Revenue"
              value={formatCurrency(financialData.totalRevenue)}
              color="#27ae60"
              trend="up"
              trendValue="+15% from last month"
            />
            <StatCard
              icon={FiCreditCard}
              title="Total Expenses"
              value={formatCurrency(financialData.totalExpenses)}
              color="#e74c3c"
              trend="down"
              trendValue="-5% from last month"
            />
            <StatCard
              icon={FiTrendingUp}
              title="Net Profit"
              value={formatCurrency(financialData.netProfit)}
              color="#3498db"
              trend="up"
              trendValue="+22% from last month"
            />
            <StatCard
              icon={FiFileText}
              title="Pending Invoices"
              value={financialData.pendingInvoices}
              color="#f39c12"
              trend="down"
              trendValue="-3 from last week"
            />
          </div>

          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiFileText /> Recent Transactions</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="transactions-list">
                {recentTransactions.map(transaction => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-icon">
                      {transaction.type === 'income' ? 
                        <FiTrendingUp className="income-icon" /> : 
                        <FiTrendingDown className="expense-icon" />
                      }
                    </div>
                    <div className="transaction-info">
                      <h4>{transaction.description}</h4>
                      <p>{transaction.date}</p>
                    </div>
                    <div className="transaction-amount">
                      <span className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                      <span className={`status ${transaction.status}`}>
                        {transaction.status === 'completed' ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />}
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiPieChart /> Budget Analysis</h2>
                <button className="view-all-btn">Detailed Report</button>
              </div>
              <div className="budget-analysis">
                {budgetAnalysis.map((budget, index) => (
                  <div key={index} className="budget-card">
                    <div className="budget-header">
                      <h4>{budget.department}</h4>
                      <span className={`budget-status ${budget.status}`}>
                        {budget.status === 'under' ? 'Under Budget' : 'Over Budget'}
                      </span>
                    </div>
                    <div className="budget-details">
                      <div className="budget-row">
                        <span>Budgeted:</span>
                        <span>{formatCurrency(budget.budgeted)}</span>
                      </div>
                      <div className="budget-row">
                        <span>Actual:</span>
                        <span>{formatCurrency(budget.actual)}</span>
                      </div>
                      <div className="budget-row variance">
                        <span>Variance:</span>
                        <span className={budget.variance > 0 ? 'positive' : 'negative'}>
                          {budget.variance > 0 ? '+' : ''}{formatCurrency(budget.variance)}
                        </span>
                      </div>
                    </div>
                    <div className="budget-progress">
                      <div className="progress-bar">
                        <div 
                          className={`progress-fill ${budget.status}`}
                          style={{ width: `${Math.min((budget.actual / budget.budgeted) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {Math.round((budget.actual / budget.budgeted) * 100)}% utilized
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiCalendar /> Quick Actions</h2>
              </div>
              <div className="quick-actions">
                <div className="action-card">
                  <FiFileText size={32} />
                  <h3>Generate Invoice</h3>
                  <p>Create and send invoices to clients</p>
                  <button className="action-card-btn">Create Invoice</button>
                </div>
                <div className="action-card">
                  <FiDollarSign size={32} />
                  <h3>Record Payment</h3>
                  <p>Record received payments and expenses</p>
                  <button className="action-card-btn">Record Payment</button>
                </div>
                <div className="action-card">
                  <FiPieChart size={32} />
                  <h3>Financial Report</h3>
                  <p>Generate comprehensive financial reports</p>
                  <button className="action-card-btn">Generate Report</button>
                </div>
                <div className="action-card">
                  <FiTrendingUp size={32} />
                  <h3>Budget Planning</h3>
                  <p>Plan and manage department budgets</p>
                  <button className="action-card-btn">Plan Budget</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceDashboard;
