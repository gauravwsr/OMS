import { useLocation, useNavigate } from 'react-router-dom';
// import 'bootstrap/dist/css/bootstrap.min.css';

const EmailDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};

  if (!email) {
    return <p className="text-center mt-5">No email details available.</p>;
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-lg">
        <div className="card-header bg-primary text-white">
          <h2>Email Details</h2>
        </div>
        <div className="card-body">
          <p><strong>From:</strong> {email.from}</p>
          <p><strong>Subject:</strong> {email.subject}</p>
          <p><strong>Date:</strong> {new Date(email.date).toLocaleString()}</p>
          <p><strong>Body:</strong></p>
          <p className="border p-3 bg-light">{email.body}</p>
          <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>Back to Inbox</button>
        </div>
      </div>
    </div>
  );
};

export default EmailDetails;
