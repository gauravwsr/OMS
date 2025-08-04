import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Clock, AlertCircle, Check, X, RefreshCw, Filter } from 'lucide-react';

const HRLeaveManagement = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'table' or 'dashboard'

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    leaveTypeDistribution: [],
    monthlyApplications: []
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const STATUS_COLORS = {
    Pending: '#f59e0b',
    Approved: '#10b981',
    Rejected: '#ef4444'
  };

  // Fetch all leave applications on component mount
  useEffect(() => {
    fetchLeaveApplications();
  }, []);

  // Calculate dashboard stats when leave applications change
  useEffect(() => {
    calculateDashboardStats();
  }, [leaveApplications]);

  // Function to calculate dashboard stats
  const calculateDashboardStats = () => {
    if (leaveApplications.length === 0) return;

    // Count applications by status
    const pending = leaveApplications.filter(app => app.status === 'Pending').length;
    const approved = leaveApplications.filter(app => app.status === 'Approved').length;
    const rejected = leaveApplications.filter(app => app.status === 'Rejected').length;

    // Calculate leave type distribution
    const leaveTypes = {};
    leaveApplications.forEach(app => {
      const type = app.leaveType === 'Other' ? app.customLeaveType : app.leaveType;
      leaveTypes[type] = (leaveTypes[type] || 0) + 1;
    });

    const leaveTypeDistribution = Object.keys(leaveTypes).map(type => ({
      name: type,
      value: leaveTypes[type]
    }));

    // Calculate monthly application distribution (last 6 months)
    const monthlyData = {};
    const today = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(today.getMonth() - i);
      const monthYear = `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
      monthlyData[monthYear] = {
        month: monthYear,
        Pending: 0,
        Approved: 0,
        Rejected: 0
      };
    }

    // Count applications by month and status
    leaveApplications.forEach(app => {
      const date = new Date(app.leaveDates.start);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;

      // Only include last 6 months
      if (monthlyData[monthYear]) {
        monthlyData[monthYear][app.status] = (monthlyData[monthYear][app.status] || 0) + 1;
      }
    });

    const monthlyApplications = Object.values(monthlyData);

    setDashboardStats({
      total: leaveApplications.length,
      pending,
      approved,
      rejected,
      leaveTypeDistribution,
      monthlyApplications
    });
  };

  // Function to fetch all leave applications
  const fetchLeaveApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://142.93.213.81:5001/api/leave-applications');
      setLeaveApplications(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch leave applications. Please try again.');
      console.error('Error fetching leave applications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to update leave application status
  const updateLeaveStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(`http://142.93.213.81:5001/api/leave-applications/${id}`, {
        status: newStatus
      });

      // Update the leave application in the state
      setLeaveApplications(prevApplications =>
        prevApplications.map(app =>
          app._id === id ? { ...app, status: newStatus } : app
        )
      );

      setSuccessMessage(`Leave application status updated to ${newStatus}`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to update leave application status. Please try again.');
      console.error('Error updating leave application status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter applications based on status
  const filteredApplications = filterStatus === 'All'
    ? leaveApplications
    : leaveApplications.filter(app => app.status === filterStatus);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate the duration of leave in days
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end days
  };

  // Open application detail modal
  const openApplicationDetail = (application) => {
    setSelectedApplication(application);
  };

  // Close application detail modal
  const closeApplicationDetail = () => {
    setSelectedApplication(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">HR Leave Management System</h1>
            <div className="flex space-x-2">

              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-4 py-2 rounded ${viewMode === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Applications
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <Check size={20} className="mr-2" />
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <AlertCircle size={20} className="mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && viewMode === 'dashboard' && (
          <div className="dashboard">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Applications</p>
                    <h2 className="text-3xl font-bold">{dashboardStats.total}</h2>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <h2 className="text-3xl font-bold text-yellow-500">{dashboardStats.pending}</h2>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Clock size={24} className="text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Approved</p>
                    <h2 className="text-3xl font-bold text-green-500">{dashboardStats.approved}</h2>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Check size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Rejected</p>
                    <h2 className="text-3xl font-bold text-red-500">{dashboardStats.rejected}</h2>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <X size={24} className="text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Monthly Applications Chart */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Monthly Leave Applications</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardStats.monthlyApplications}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Pending" fill={STATUS_COLORS.Pending} />
                      <Bar dataKey="Approved" fill={STATUS_COLORS.Approved} />
                      <Bar dataKey="Rejected" fill={STATUS_COLORS.Rejected} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Leave Type Distribution */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Leave Type Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardStats.leaveTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {dashboardStats.leaveTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Applications */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveApplications.slice(0, 5).map((application) => (
                      <tr key={application._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">{application.leaveReason}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(application.leaveDates.start)} - {formatDate(application.leaveDates.end)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {application.leaveType === 'Other' ? application.customLeaveType : application.leaveType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${application.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'}`}
                          >
                            {application.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && viewMode === 'table' && (
          <div>
            {/* Filter Controls */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Filter size={20} className="text-gray-500" />
                  <label htmlFor="statusFilter" className="text-gray-700">Filter by Status:</label>
                  <select
                    id="statusFilter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <button
                  onClick={fetchLeaveApplications}
                  disabled={loading}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-150"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Leave Applications Table */}
            {filteredApplications.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <p className="text-gray-500">No leave applications found</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredApplications.map((application) => (
                        <tr
                          key={application._id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openApplicationDetail(application)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">{application.leaveReason}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(application.leaveDates.start)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{formatDate(application.leaveDates.end)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {calculateDuration(application.leaveDates.start, application.leaveDates.end)} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {application.leaveType === 'Other'
                              ? `${application.leaveType}: ${application.customLeaveType}`
                              : application.leaveType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${application.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                  application.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'}`}
                            >
                              {application.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={application.status}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateLeaveStatus(application._id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={loading}
                              className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-bold">Leave Application Details</h3>
              <button
                onClick={closeApplicationDetail}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Leave Reason</p>
                  <p className="font-medium">{selectedApplication.leaveReason}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <p className="font-medium">
                    {selectedApplication.leaveType === 'Other'
                      ? `${selectedApplication.leaveType}: ${selectedApplication.customLeaveType}`
                      : selectedApplication.leaveType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{formatDate(selectedApplication.leaveDates.start)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{formatDate(selectedApplication.leaveDates.end)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">
                    {calculateDuration(selectedApplication.leaveDates.start, selectedApplication.leaveDates.end)} days
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${selectedApplication.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        selectedApplication.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}
                  >
                    {selectedApplication.status}
                  </span>
                </div>
              </div>

              {/* Additional details can be added here */}

              <div className="mt-6 pt-4 border-t flex justify-end">
                <select
                  value={selectedApplication.status}
                  onChange={(e) => updateLeaveStatus(selectedApplication._id, e.target.value)}
                  disabled={loading}
                  className="border rounded px-3 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={closeApplicationDetail}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition duration-150"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLeaveManagement;