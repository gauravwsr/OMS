// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Forgot.css"; // Importing CSS

// const loginImage = "/Images/Rectangle22.jpg"; // ✅ Correct path

// const Forgot = () => {
//   const [email, setEmail] = useState("");
//   const navigate = useNavigate(); // For navigation to Verify page

//  const handleSubmit = async (e) => {
//   e.preventDefault();

//   try {
//     const response = await fetch("http://142.93.213.81:5001/api/auth/forgot-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email }),
//     });

//     const data = await response.json();

//     if (response.ok) {
//       console.log("Verification code sent to:", email);
//       navigate("/verify", { state: { email } }); // Navigate to verification page
//     } else {
//       alert(data.message || "Error sending verification code");
//     }
//   } catch (error) {
//     console.error("Error:", error);
//   }
// };

//   return (
//     <div className="forgot-container">
//       <div className="forgot-box">
//         {/* Left Side - Forgot Password Form */}
//         <div className="forgot-form">
//           {/* Back to Login Button */}
//           <Link to="/login" className="back-to-login">
//             <span className="arrow">{'<'}</span> Back to login
//           </Link>

//           {/* Forgot Password Heading */}
//           <h1 className="forgot-title">Forgot your password?</h1>
//           <p className="forgot-text">
//             Don’t worry, happens to all of us. Enter your email below to recover your password.
//           </p>

//           <form onSubmit={handleSubmit} className="forgot-form-group">
//             <div>
//               <label htmlFor="email" className="forgot-label">
//                 Email <span className="required">*</span>
//               </label>
//               <input
//                 type="email"
//                 id="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="forgot-input"
//                 placeholder="Enter your email"
//               />
//             </div>

//             <div>
//               <button type="submit" className="forgot-button">
//                 Submit
//               </button>
//             </div>
//           </form>
//         </div>

//         {/* Right Side - Image */}
//         <div className="forgot-image">
//           <img src={loginImage} alt="Forgot Password Illustration" />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Forgot;


import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "./authApi.js"; // Import API function
import "./Forgot.css";

const Forgot = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await forgotPassword(email);
      if (data.message) {
        console.log("OTP sent to:", email);
        navigate("/verify", { state: { email } }); // Navigate with email
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="forgot-container" style={{ display: "flex", flexDirection: "column" }}>
      <h1>Forgot Password?</h1>
      <p>Enter your email to receive a verification code.</p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default Forgot;
