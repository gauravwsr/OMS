import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HRLeaveManagement.css';
import { useAuth } from '../AuthProvider/AuthContext';

const HRLeaveManagement = () => {
  const { user } = useAuth();
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [filterStatus, setFilterStatus] = useState('All');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    console.log('User object in HRLeaveManagement:', user);
    fetchLeaveApplications();
  }, []);

  const fetchLeaveApplications = async () => {
    setLoading(true);
    try {
      console.log('Fetching employee leave applications...');
      const response = await axios.get('http://142.93.213.81:5001/api/leave/employees');
      console.log('Employee leave applications response:', response.data);
      
      if (response.data.success) {
        setLeaveApplications(response.data.data);
        console.log('Employee leave applications set:', response.data.data);
      } else {
        console.log('Failed to fetch employee leave applications:', response.data);
      }
    } catch (error) {
      console.error('Error fetching employee leave applications:', error);
      console.error('Error response:', error.response?.data);
      setMessage({
        type: 'error',
        text: 'Failed to fetch employee leave applications'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, action, comments = '') => {
    try {
      console.log('handleLeaveAction called with:', { leaveId, action, comments });
      console.log('User object:', user);
      console.log('User _id:', user?._id);
      
      if (!user || !user._id) {
        setMessage({
          type: 'error',
          text: 'User information not available. Please login again.'
        });
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      const requestData = {
        status: action,
        reviewComments: comments,
        reviewedBy: user._id
      };
      
      console.log('Request data:', requestData);
      console.log('Making API call to:', `http://142.93.213.81:5001/api/leave/status/${leaveId}`);

      const response = await axios.patch(`http://142.93.213.81:5001/api/leave/status/${leaveId}`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Leave application ${action.toLowerCase()} successfully`
        });
        fetchLeaveApplications(); // Refresh the list
      } else {
        console.log('API returned success: false');
        setMessage({
          type: 'error',
          text: response.data.message || `Failed to ${action.toLowerCase()} leave application`
        });
      }
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing leave:`, error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = `Failed to ${action.toLowerCase()} leave application`;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      }
      
      setMessage({
        type: 'error',
        text: errorMessage
      });
    }
  };

  const approveLeave = (leaveId) => {
    handleLeaveAction(leaveId, 'Approved');
  };

  const openRejectModal = (leaveId) => {
    setSelectedLeaveId(leaveId);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const handleRejectSubmit = () => {
    if (selectedLeaveId) {
      handleLeaveAction(selectedLeaveId, 'Rejected', rejectReason);
      setShowRejectModal(false);
      setSelectedLeaveId(null);
      setRejectReason('');
    }
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setSelectedLeaveId(null);
    setRejectReason('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'pending': return 'badge-warning';
      default: return 'badge-secondary';
    }
  };

  const filteredApplications = leaveApplications.filter(leave => {
    if (filterStatus === 'All') return true;
    return leave.status === filterStatus;
  });

  const statusCounts = {
    All: leaveApplications.length,
    Pending: leaveApplications.filter(l => l.status === 'Pending').length,
    Approved: leaveApplications.filter(l => l.status === 'Approved').length,
    Rejected: leaveApplications.filter(l => l.status === 'Rejected').length
  };

  return (
    <div className="hr-leave-management">
      <div className="page-header">
        <h1>Employee Leave Management</h1>
        <p>Review and manage employee leave applications</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-section">
        <div className="stats-cards">
          <div className="stat-card total">
            <h3>Total Applications</h3>
            <div className="stat-number">{statusCounts.All}</div>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <div className="stat-number">{statusCounts.Pending}</div>
          </div>
          <div className="stat-card approved">
            <h3>Approved</h3>
            <div className="stat-number">{statusCounts.Approved}</div>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <div className="stat-number">{statusCounts.Rejected}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
          <button
            key={status}
            className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="applications-section">
        {loading ? (
          <div className="loading">Loading leave applications...</div>
        ) : filteredApplications.length === 0 ? (
          <div className="no-data">
            No {filterStatus === 'All' ? '' : filterStatus.toLowerCase()} employee leave applications found.
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((leave) => (
              <div key={leave._id} className="leave-application-item">
                <div className="leave-header">
                  <div className="employee-details">
                    <h3 className="employee-name">{leave.employeeName}</h3>
                    <div className="employee-meta">
                      <span>{leave.employeeRole}</span> • <span>{leave.employeeEmail}</span>
                    </div>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(leave.status)}`}>
                    {leave.status}
                  </span>
                </div>

                <div className="leave-content">
                  <h4 className="leave-reason">{leave.leaveReason}</h4>
                  
                  <div className="leave-info-grid">
                    <div className="info-item">
                      <span className="info-label">Leave Type:</span>
                      <span className="info-value">
                        {leave.leaveType} {leave.leaveType === 'Other' && leave.customLeaveType ? `- ${leave.customLeaveType}` : ''}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Duration:</span>
                      <span className="info-value">{leave.totalDays} days</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Start Date:</span>
                      <span className="info-value">{formatDate(leave.leaveDates.start)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">End Date:</span>
                      <span className="info-value">{formatDate(leave.leaveDates.end)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Applied on:</span>
                      <span className="info-value">{formatDate(leave.appliedDate)}</span>
                    </div>
                    {leave.reviewedDate && (
                      <div className="info-item">
                        <span className="info-label">Reviewed on:</span>
                        <span className="info-value">{formatDate(leave.reviewedDate)}</span>
                      </div>
                    )}
                  </div>

                  {leave.reviewComments && (
                    <div className="review-comments">
                      <strong>Review Comments:</strong> {leave.reviewComments}
                    </div>
                  )}

                  {leave.status === 'Pending' && (
                    <div className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={() => approveLeave(leave._id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => openRejectModal(leave._id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="reject-modal">
            <div className="modal-header">
              <h3>Reject Leave Application</h3>
            </div>
            <div className="modal-body">
              <label htmlFor="rejectReason">Reason for rejection:</label>
              <textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this leave application..."
                rows={4}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelReject}>
                Cancel
              </button>
              <button
                className="btn-confirm-reject"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLeaveManagement;
