import React from 'react';
import Navbar from "./Navbar";
import './Candidatepf.css';

const CandidateProfile = () => {
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
            src="Images/qwe.png"
            alt="Dhanesh Bhai"
            className="profile-image"
          />
          <div className="profile-details">
            <h2 className="profile-name">Dhanesh Bhai</h2>
            <p className="profile-role">UI/UX Designer</p>
          </div>
          <div className="developer-chip">
  <i className="fas fa-file-pdf"></i> Danish Ui Ux cv.pdf
</div>

        </div>

        <div className="contact-info">
          <div className="contact-wave"></div>
          <div className="contact-item">Phone No. - +91 1234567890</div>
          <div className="contact-item">Department - Design</div>
          <div className="contact-item">Employee Type: Full -Time</div>
          <div className="contact-item">Emergency Contact - +91 1234567890</div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CandidateProfile;