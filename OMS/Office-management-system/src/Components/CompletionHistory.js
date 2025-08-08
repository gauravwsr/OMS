import React, { useState, useEffect } from 'react';
import './Certificates/Certificate.css'; // Use the certificate styles

const CompletionHistory = () => {
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const courseTypes = [
    "Web Development Course",
    "UI/UX Design Course",
    "Cloud Computing Course",
    "DevOps Training",
    "IoT Development Course",
    "Digital Marketing Course",
    "Data Science Course",
    "Mobile App Development",
    "Cybersecurity Course",
    "Machine Learning Course",
  ];

  useEffect(() => {
    fetchCompletions();
  }, []);

  const fetchCompletions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/completions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCompletions(data.completions || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch completion certificates');
      }
    } catch (error) {
      console.error('Error fetching completion certificates:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const deleteCompletion = async (id) => {
    if (!window.confirm('Are you sure you want to delete this completion certificate?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/completions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setCompletions(completions.filter(completion => completion._id !== id));
        alert('Completion certificate deleted successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete completion certificate');
      }
    } catch (error) {
      console.error('Error deleting completion certificate:', error);
      alert('Failed to delete completion certificate');
    }
  };

  const downloadCompletion = async (id, certID) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/completions/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `completion_${certID}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download completion certificate image');
      }
    } catch (error) {
      console.error('Error downloading completion certificate:', error);
      alert('Failed to download completion certificate image');
    }
  };

  const filteredCompletions = completions.filter(completion => {
    const matchesSearch = completion.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         completion.instituteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         completion.certID.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCourse = filterCourse === '' || completion.courseType === filterCourse;
    return matchesSearch && matchesCourse;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="certificate-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading completion certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-container">
      <div className="certificate-header">
        <h1>Completion Certificate History</h1>
        <p>Manage and view all completion certificates</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchCompletions} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by participant name, institute, or certificate ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="filter-select"
          >
            <option value="">All Courses</option>
            {courseTypes.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="certificate-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredCompletions.length}</span>
          <span className="stat-label">Total Completions</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{new Set(filteredCompletions.map(c => c.courseType)).size}</span>
          <span className="stat-label">Course Types</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{new Set(filteredCompletions.map(c => c.instituteName)).size}</span>
          <span className="stat-label">Institutes</span>
        </div>
      </div>

      {filteredCompletions.length === 0 ? (
        <div className="no-certificates">
          <div className="no-certificates-icon">📜</div>
          <h3>No completion certificates found</h3>
          <p>
            {searchTerm || filterCourse 
              ? "Try adjusting your search or filter criteria" 
              : "No completion certificates have been created yet"
            }
          </p>
        </div>
      ) : (
        <div className="certificate-grid">
          {filteredCompletions.map((completion) => (
            <div key={completion._id} className="certificate-card">
              <div className="certificate-card-header">
                <h3>{completion.participantName}</h3>
                <span className={`grade-badge grade-${completion.grade.replace('+', 'plus')}`}>
                  {completion.grade}
                </span>
              </div>
              
              <div className="certificate-card-body">
                <div className="certificate-info">
                  <div className="info-row">
                    <span className="label">Certificate ID:</span>
                    <span className="value">{completion.certID}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Course:</span>
                    <span className="value">{completion.courseType}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Institute:</span>
                    <span className="value">{completion.instituteName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Duration:</span>
                    <span className="value">{completion.duration}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Period:</span>
                    <span className="value">
                      {formatDate(completion.startDate)} - {formatDate(completion.endDate)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Issued:</span>
                    <span className="value">{formatDate(completion.issueDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Instructor:</span>
                    <span className="value">{completion.instructorName}</span>
                  </div>
                </div>
              </div>
              
              <div className="certificate-card-footer">
                <button
                  onClick={() => downloadCompletion(completion._id, completion.certID)}
                  className="btn btn-primary"
                  title="Download Certificate"
                >
                  📥 Download
                </button>
                <button
                  onClick={() => deleteCompletion(completion._id)}
                  className="btn btn-danger"
                  title="Delete Certificate"
                >
                  🗑️ Delete
                </button>
              </div>
              
              <div className="certificate-card-meta">
                <small>Created: {formatDate(completion.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletionHistory;
