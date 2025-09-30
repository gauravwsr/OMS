import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import axios from "axios";
import "./ViewDetails.css";

const ViewDetails = () => {
  const { id } = useParams(); // Get candidateId from URL
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidateDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:5001/api/candidates/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCandidate(response.data.data);
        console.log("Candidate details:", response.data.data);
      } catch (error) {
        console.error("Error fetching candidate details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateDetails();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!candidate) return <p>Candidate not found</p>;

  const handleDownload = () => {
    // Extract filename from cvPath (remove directory path)
    const cvFilename = candidate.cvPath ? candidate.cvPath.split('/').pop() : null;
    const cvUrl = cvFilename
      ? `http://localhost:5001/uploads/documents/${cvFilename}`
      : "/default_cv.pdf";
    const link = document.createElement("a");
    link.href = cvUrl;
    link.setAttribute("download", cvFilename || "default_cv.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download the ID card as an image by capturing the .profile-cardd element
  const handleDownloadCard = async () => {
    try {
      const el = document.querySelector(".profile-cardd");
      if (!el) return;
      // dynamic import so this works even if html2canvas isn't already bundled
      const module = await import("html2canvas");
      const html2canvas = module.default || module;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      const name = (candidate.fullName || "id_card").replace(/\s+/g, "_");
      link.download = `${name}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download ID card:", err);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="containerr">
      {/* Header */}
      <div className="header">
        <FaArrowLeft
          className="back-icon"
          onClick={handleGoBack}
          style={{ cursor: "pointer" }}
        />
        <h2 className="title">Candidate Profile</h2>
      </div>

      {/* Professional ID Card - Single Section with All Information */}
      <div className="profile-cardd">
        {/* Company Header */}
        <div className="company-header">
          <img
            src="/images/TARS_Black.jpeg"
            alt="TARS Technologies Logo"
            className="company-logo-img"
          />
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <img
            src={
              candidate.photoPath
                ? `http://localhost:5001/uploads/photos/${candidate.photoPath}`
                : `https://api.dicebear.com/8.x/avataaars/svg?seed=${candidate.fullName}`
            }
            alt={candidate.fullName}
            className="profile-img"
          />
          <h3 className="name">{candidate.fullName}</h3>
          <p className="role">{candidate.subRole || candidate.role}</p>
        </div>

        {/* Contact Information */}
        <div className="contact-info">
          <div className="contact-item phone">{candidate.phoneNo || "N/A"}</div>
          <div className="contact-item email">
            {candidate.email ? candidate.email : "N/A"}
          </div>
          <div className="contact-item id">
            #{candidate.candidateId || "032024065"}
          </div>
          <div className="website">www.tars.co.in</div>
        </div>

        {/* ID Card Frame at Bottom */}
        <div className="card-frame">
          <img
            src="/images/frame.jpeg"
            alt="ID Card Frame"
            className="frame-img"
          />
        </div>
      </div>

      {/* Additional Details Card */}
      <div className="details-card">
        <h3 className="details-title">Additional Information</h3>
        <div className="additional-details">
          <div className="detail-item">
            <strong>Department:</strong> {candidate.role || "N/A"}
          </div>
          <div className="detail-item">
            <strong>Qualification:</strong> {candidate.qualification || "N/A"}
          </div>
          <div className="detail-item">
            <strong>Birth Date:</strong>{" "}
            {candidate.birthDate
              ? new Date(candidate.birthDate).toLocaleDateString()
              : "N/A"}
          </div>
          <div className="detail-item">
            <strong>Address:</strong> {candidate.address || "N/A"}
          </div>
          <div className="detail-item">
            <strong>Country:</strong> {candidate.country || "N/A"}
          </div>
          <div className="detail-item">
            <strong>Emergency Contact:</strong> {candidate.emergencyNo || "N/A"}
          </div>
        </div>
      </div>

      {/* Download Actions */}
      <div className="download-actions">
        <button className="cv-button" onClick={handleDownload}>
          <FaDownload className="icon" />
          <span>Download CV</span>
        </button>

        <button className="download-card-button" onClick={handleDownloadCard}>
          <FaDownload className="icon" />
          <span>Download ID Card</span>
        </button>
      </div>
    </div>
  );
};

export default ViewDetails;
