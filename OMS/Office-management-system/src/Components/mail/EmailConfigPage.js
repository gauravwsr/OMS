import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import EmailConfig from './EmailConfig';
import './EmailConfigPage.css';

const EmailConfigPage = () => {
  const navigate = useNavigate();

  const handleConfigured = () => {
    // Redirect back to inbox after configuration
    navigate('../Inbox');
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="email-config-page">
      <div className="email-config-page-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={20} />
          Back
        </button>
        <h1>Email Configuration</h1>
      </div>
      
      <div className="email-config-page-content">
        <EmailConfig onConfigured={handleConfigured} />
      </div>
    </div>
  );
};

export default EmailConfigPage;
