// import './Inbox.css'
// import { useNavigate } from 'react-router-dom';

// const SentSection = ({emails})=>{
//    const navigate = useNavigate();
  
//     const handleEmailClick = (email) => {
//       navigate('email-details', { state: { email } });
//     };
    

//     return (
//         <div>
//              {emails.length > 0 ? (
//             emails.map((email) => (
//               <div key={email._id} className="meeting-row">
//                 <div className="meeting-name">
//                   {/* <input
//                     type="checkbox"
//                     id={`email-${email._id}`}
//                     className="meeting-checkbox"
//                   /> */}
//                   <label htmlFor={`email-${email._id}`} className="meeting-label">
//                     {email.to}
//                   </label>
//                 </div>
//                 <div
//               className="meeting-description"
//               onClick={() => handleEmailClick(email)}
//               style={{ cursor: 'pointer' }}
//             >
//               {email.subject}
//             </div>
//                 <div className="meeting-time">
//                 <span>{new Date(email.date).toLocaleString()}</span>
//                 </div>
//                 {/* <button
//                 className="delete-btn"
//                 onClick={() => handleDeleteEmail(email._id)}
//             >
//                 🗑️ Delete
//             </button> */}
//               </div>
//             ))
//           ) : (
//             <p>No emails to show</p>
//           )}
//         </div>
//     )
// }

// export default SentSection;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';

const SentSection = ({ emails }) => {
  const navigate = useNavigate();
  
  const handleEmailClick = (email) => {
    navigate('email-details', { state: { email } });
  };
  
  return (
    <div className="email-list">
      <div className="email-header-row">
        <div className="column-name">To</div>
        <div className="column-content">Mail</div>
        <div className="column-time">Time</div>
      </div>
      
      {emails.length > 0 ? (
        emails.map((email) => (
          <div key={email._id || email.id} className="email-row" onClick={() => handleEmailClick(email)}>
            <div className="email-name">
              <input
                type="checkbox"
                id={`email-${email._id || email.id}`}
                className="email-checkbox"
              />
              <label htmlFor={`email-${email._id || email.id}`} className="email-label">
                {email.recipient || email.to}
              </label>
            </div>
            <div className="email-content">
              {email.subject}
            </div>
            <div className="email-time">
              {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
            </div>
          </div>
        ))
      ) : (
        <div className="no-emails-message">No sent emails to show</div>
      )}
    </div>
  );
};

export default SentSection;