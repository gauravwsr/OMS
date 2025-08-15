import React, { useState, useEffect } from 'react';
import Navbar from "./Navbar";
import './Candidatepf.css';
import { downloadResume, viewFile } from '../utils/downloadUtils';

const CandidateProfile = ({ candidateId }) => {
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Sample candidate data - in real app, fetch from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCandidate({
        id: candidateId || '1',
        fullName: 'Dhanesh Bhai',
        role: 'UI/UX Designer',
        phone: '+91 1234567890',
        department: 'Design',
        employeeType: 'Full-Time',
        emergencyContact: '+91 1234567890',
        cvPath: 'https://res.cloudinary.com/demo/image/upload/v1234567890/resumes/danish-ui-ux-cv.pdf', // Sample Cloudinary URL
        profileImage: 'Images/qwe.png',
        hasCloudinaryCV: true // Flag to indicate if CV is stored in Cloudinary
      });
      setLoading(false);
    }, 1000);
  }, [candidateId]);

  // Function to download resume/CV using utility
  const handleDownloadResume = async () => {
    if (!candidate || downloading) return;
    
    setDownloading(true);
    
    try {
      const success = await downloadResume(candidate);
      if (success) {
        console.log('✅ Resume download completed successfully');
      }
    } catch (error) {
      console.error('❌ Resume download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  // Function to view resume in new tab
  const handleViewResume = () => {
    if (!candidate || !candidate.cvPath) return;
    
    viewFile(candidate.cvPath, `${candidate.fullName}_CV`);
  };

  if (loading) {
    return (
      <div className="main-cont">
        <div className="profile-container">
          <div className="loading-message">
            <p>📄 Loading candidate profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="main-cont">
        <div className="profile-container">
          <div className="error-message">
            <p>❌ Candidate not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-cont"> 
      {/* <Navbar /> */}
    <div className="profile-container">
      <div className="profile-header">
        <div className="header-wave"></div>
        <button className="back-button">↩</button>
        <h1 className="profile-title">Candidate Profile</h1>
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <img 
            src={candidate.profileImage || "Images/qwe.png"}
            alt={candidate.fullName}
            className="profile-image"
          />
          <div className="profile-details">
            <h2 className="profile-name">{candidate.fullName}</h2>
            <p className="profile-role">{candidate.role}</p>
          </div>
          
          {/* Enhanced Resume/CV Section */}
          {candidate.cvPath && (
            <div className="resume-section">
              <div className="developer-chip">
                <i className="fas fa-file-pdf"></i> 
                <span className="cv-name">{candidate.fullName} CV.pdf</span>
                {candidate.hasCloudinaryCV && (
                  <span className="cloudinary-badge" title="Stored in Cloudinary">☁️</span>
                )}
              </div>
              
              <div className="resume-actions">
                <button 
                  className="resume-action-btn download-btn"
                  onClick={handleDownloadResume}
                  disabled={downloading}
                  title="Download resume from Cloudinary"
                >
                  {downloading ? '⏳' : '⬇️'} 
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                
                <button 
                  className="resume-action-btn view-btn"
                  onClick={handleViewResume}
                  title="View resume in new tab"
                >
                  👁️ View
                </button>
              </div>
            </div>
          )}
          
          {!candidate.cvPath && (
            <div className="no-resume-message">
              <p>📄 No resume uploaded</p>
            </div>
          )}
        </div>

        <div className="contact-info">
          <div className="contact-wave"></div>
          <div className="contact-item">Phone No. - {candidate.phone}</div>
          <div className="contact-item">Department - {candidate.department}</div>
          <div className="contact-item">Employee Type: {candidate.employeeType}</div>
          <div className="contact-item">Emergency Contact - {candidate.emergencyContact}</div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CandidateProfile;