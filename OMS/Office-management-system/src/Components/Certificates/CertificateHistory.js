import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Certificate.css";

const CertificateHistory = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      const response = await fetch(
        "http://146.190.165.62:5000/api/certificates",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch certificates");
      }

      setCertificates(result.certificates || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCertificate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required. Please login.");
        return;
      }

      const response = await fetch(
        `http://146.190.165.62:5000/api/certificates/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete certificate");
      }

      // Refresh the list
      fetchCertificates();
    } catch (err) {
      setError(err.message);
      console.error("Error deleting certificate:", err);
    }
  };

  const downloadCertificateImage = async (certificate) => {
    try {
      if (certificate.certificateImageData) {
        // Create download link for base64 image
        const link = document.createElement("a");
        link.href = certificate.certificateImageData;
        link.download = `${certificate.studentName}-${certificate.certID}-certificate.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError("Certificate image not available for download");
      }
    } catch (err) {
      setError("Error downloading certificate image");
      console.error("Error downloading certificate image:", err);
    }
  };

  if (loading) {
    return (
      <div className="certificate-page">
        <div className="certificate-container">
          <div className="loading">Loading certificates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="certificate-page">
      <div className="certificate-container">
        <div className="admin-panel">
          <div className="header-section">
            <h3>Certificate History</h3>
            <button
              onClick={() => navigate("/certificates")}
              className="back-button"
            >
              ← Back to Create Certificate
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {certificates.length === 0 ? (
            <div className="no-certificates">
              <p>No certificates found.</p>
              <button
                onClick={() => navigate("/certificates")}
                className="create-button"
              >
                Create Your First Certificate
              </button>
            </div>
          ) : (
            <div className="certificates-grid">
              {certificates.map((cert) => (
                <div key={cert._id} className="certificate-card">
                  <div className="certificate-header">
                    <h4>{cert.studentName}</h4>
                    <span className="cert-id">ID: {cert.certID}</span>
                  </div>

                  <div className="certificate-details">
                    <p>
                      <strong>College:</strong> {cert.collegeName}
                    </p>
                    <p>
                      <strong>Internship:</strong> {cert.internshipType}
                    </p>
                    <p>
                      <strong>Company:</strong> {cert.companyName}
                    </p>
                    <p>
                      <strong>Duration:</strong> {cert.startDate} to{" "}
                      {cert.endDate}
                    </p>
                    <p>
                      <strong>Issue Date:</strong> {cert.issueDate}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(cert.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="certificate-actions">
                    {cert.certificateImageData && (
                      <button
                        onClick={() => downloadCertificateImage(cert)}
                        className="download-image-button"
                      >
                        Download Image
                      </button>
                    )}
                    <button
                      onClick={() => deleteCertificate(cert._id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>

                  {cert.certificateImageData && (
                    <div className="certificate-preview">
                      <img
                        src={cert.certificateImageData}
                        alt={`Certificate for ${cert.studentName}`}
                        style={{
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          marginTop: "10px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateHistory;
