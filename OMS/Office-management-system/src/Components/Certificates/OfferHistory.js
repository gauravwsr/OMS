import React, { useState, useEffect } from 'react';
import './Certificate.css'; // Use the certificate styles

const OfferHistory = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  const statuses = ["Pending", "Accepted", "Rejected", "Expired"];
  const positions = [
    "Software Developer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "UI/UX Designer",
    "Data Scientist",
    "DevOps Engineer",
    "QA Engineer",
    "Project Manager",
    "Business Analyst",
    "Digital Marketing Executive",
    "HR Executive",
  ];

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch('/api/offers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch offer letters');
      }
    } catch (error) {
      console.error('Error fetching offer letters:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer letter?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/offers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setOffers(offers.filter(offer => offer._id !== id));
        alert('Offer letter deleted successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete offer letter');
      }
    } catch (error) {
      console.error('Error deleting offer letter:', error);
      alert('Failed to delete offer letter');
    }
  };

  const downloadOffer = async (id, offerID) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/offers/${id}/download`, {
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
        a.download = `offer_${offerID}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download offer letter image');
      }
    } catch (error) {
      console.error('Error downloading offer letter:', error);
      alert('Failed to download offer letter image');
    }
  };

  const updateOfferStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/offers/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(offers.map(offer => 
          offer._id === id ? { ...offer, status: newStatus } : offer
        ));
        alert('Offer status updated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update offer status');
      }
    } catch (error) {
      console.error('Error updating offer status:', error);
      alert('Failed to update offer status');
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.offerID.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || offer.status === filterStatus;
    const matchesPosition = filterPosition === '' || offer.position === filterPosition;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f39c12';
      case 'Accepted': return '#27ae60';
      case 'Rejected': return '#e74c3c';
      case 'Expired': return '#95a5a6';
      default: return '#333';
    }
  };

  if (loading) {
    return (
      <div className="certificate-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading offer letters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-container">
      <div className="certificate-header">
        <h1>Offer Letter History</h1>
        <p>Manage and view all offer letters</p>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchOffers} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by candidate name, position, or offer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-box">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-box">
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="filter-select"
          >
            <option value="">All Positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="certificate-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredOffers.length}</span>
          <span className="stat-label">Total Offers</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{new Set(filteredOffers.map(o => o.position)).size}</span>
          <span className="stat-label">Positions</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{new Set(filteredOffers.map(o => o.department)).size}</span>
          <span className="stat-label">Departments</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{filteredOffers.filter(o => o.status === 'Pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
      </div>

      {filteredOffers.length === 0 ? (
        <div className="no-certificates">
          <div className="no-certificates-icon">💼</div>
          <h3>No offer letters found</h3>
          <p>
            {searchTerm || filterStatus || filterPosition 
              ? "Try adjusting your search or filter criteria" 
              : "No offer letters have been created yet"
            }
          </p>
        </div>
      ) : (
        <div className="certificate-grid">
          {filteredOffers.map((offer) => (
            <div key={offer._id} className="certificate-card">
              <div className="certificate-card-header">
                <h3>{offer.candidateName}</h3>
                <span 
                  className="grade-badge" 
                  style={{ backgroundColor: getStatusColor(offer.status) }}
                >
                  {offer.status}
                </span>
              </div>
              
              <div className="certificate-card-body">
                <div className="certificate-info">
                  <div className="info-row">
                    <span className="label">Offer ID:</span>
                    <span className="value">{offer.offerID}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Position:</span>
                    <span className="value">{offer.position}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Department:</span>
                    <span className="value">{offer.department}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Company:</span>
                    <span className="value">{offer.companyName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Salary:</span>
                    <span className="value">{offer.salary}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Joining Date:</span>
                    <span className="value">{formatDate(offer.joiningDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Valid Until:</span>
                    <span className="value">{formatDate(offer.validUntil)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Work Location:</span>
                    <span className="value">{offer.workLocation}</span>
                  </div>
                </div>
              </div>
              
              <div className="certificate-card-footer">
                <button
                  onClick={() => downloadOffer(offer._id, offer.offerID)}
                  className="btn btn-primary"
                  title="Download Offer Letter"
                >
                  📥 Download
                </button>
                <select
                  value={offer.status}
                  onChange={(e) => updateOfferStatus(offer._id, e.target.value)}
                  className="btn"
                  style={{ 
                    backgroundColor: getStatusColor(offer.status),
                    color: 'white',
                    border: 'none',
                    fontSize: '12px',
                    padding: '8px'
                  }}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => deleteOffer(offer._id)}
                  className="btn btn-danger"
                  title="Delete Offer Letter"
                >
                  🗑️ Delete
                </button>
              </div>
              
              <div className="certificate-card-meta">
                <small>Created: {formatDate(offer.createdAt)}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfferHistory;
