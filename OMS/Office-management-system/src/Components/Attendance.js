import React, { useState } from 'react';
import axios from 'axios';

const LeaveApplicationForm = () => {
  const [formData, setFormData] = useState({
    leaveReason: '',
    leaveDates: {
      start: '',
      end: ''
    },
    leaveType: '',
    customLeaveType: ''
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const leaveTypes = ['Sick Leave', 'Vacation', 'Personal Leave', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('leaveDates.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        leaveDates: {
          ...prev.leaveDates,
          [key]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear errors and success messages on change
    setErrors([]);
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess('');

    // Basic client-side validation
    const validationErrors = [];
    if (!formData.leaveReason.trim()) {
      validationErrors.push('Leave reason is required');
    }
    if (!formData.leaveDates.start) {
      validationErrors.push('Start date is required');
    }
    if (!formData.leaveDates.end) {
      validationErrors.push('End date is required');
    } else {
      const startDate = new Date(formData.leaveDates.start);
      const endDate = new Date(formData.leaveDates.end);
      if (endDate < startDate) {
        validationErrors.push('End date must be after start date');
      }
    }
    if (!formData.leaveType) {
      validationErrors.push('Leave type is required');
    }
    if (formData.leaveType === 'Other' && !formData.customLeaveType.trim()) {
      validationErrors.push('Custom leave type is required when "Other" is selected');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/leave-applications', {
        leaveReason: formData.leaveReason,
        leaveDates: {
          start: formData.leaveDates.start,
          end: formData.leaveDates.end
        },
        leaveType: formData.leaveType,
        customLeaveType: formData.leaveType === 'Other' ? formData.customLeaveType : null
      });

      setSuccess(response.data.message);
      setFormData({
        leaveReason: '',
        leaveDates: {
          start: '',
          end: ''
        },
        leaveType: '',
        customLeaveType: ''
      });
    } catch (error) {
      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors(['An unexpected error occurred. Please try again later.']);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="leaveReason">Leave Reason</label>
          <textarea
            id="leaveReason"
            name="leaveReason"
            value={formData.leaveReason}
            onChange={handleChange}
            placeholder="Enter the reason for your leave"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            type="date"
            id="startDate"
            name="leaveDates.start"
            value={formData.leaveDates.start}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            type="date"
            id="endDate"
            name="leaveDates.end"
            value={formData.leaveDates.end}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="leaveType">Leave Type</label>
          <select
            id="leaveType"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
          >
            <option value="">Select a leave type</option>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {formData.leaveType === 'Other' && (
          <div className="form-group">
            <label htmlFor="customLeaveType">Custom Leave Type</label>
            <input
              type="text"
              id="customLeaveType"
              name="customLeaveType"
              value={formData.customLeaveType}
              onChange={handleChange}
              placeholder="Specify the leave type"
            />
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>

        {errors.length > 0 && (
          <div className="error">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {success && <div className="success">{success}</div>}
      </form>
    </div>
  );
};

export default LeaveApplicationForm;