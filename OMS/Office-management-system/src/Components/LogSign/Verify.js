// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Verify.css"; // Import CSS
// const loginImage = "/Images/Rectangle 22.jpg"; // Ensure the path is correct


// const Verify = () => {
//   const [code, setCode] = useState("");
//   const [showCode, setShowCode] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Code Entered:", code);
//     navigate("/setpassword"); // Redirect to Set Password Page
//   };

//   return (
//     <div className="verify-container">
//       <div className="verify-box">
//         {/* Left Side - Verify Code Form */}
//         <div className="verify-form">
//           <Link to="/login" className="back-to-login">
//             <span className="arrow">{'<'}</span> Back to login
//           </Link>

//           <h1 className="verify-title">Verify code</h1>
//           <p className="verify-text">
//             An authentication code has been sent to your email.
//           </p>

//           <form onSubmit={handleSubmit} className="verify-form-group">
//             <div className="input-container">
//               <label htmlFor="code">Enter Code <span className="required">*</span></label>
//               <input
//                 type={showCode ? "text" : "password"}
//                 id="code"
//                 value={code}
//                 onChange={(e) => setCode(e.target.value)}
//                 required
//                 className="verify-input"
//                 placeholder="Enter code"
//               />
//               <button
//                 type="button"
//                 className="toggle-visibility"
//                 onClick={() => setShowCode(!showCode)}
//               >
//                 👁
//               </button>
//             </div>

//             <p className="resend-text">
//               Didn't receive a code? <span className="resend-link">Resend</span>
//             </p>

//             <button type="submit" className="verify-button">Verify</button>
//           </form>
//         </div>

//         {/* Right Side - Image */}
//         <div className="verify-image">
//           <img src={loginImage} alt="Verify Code Illustration" />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Verify;


import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyCode } from "./authApi"; // Import verifyCode function
import "./Verify.css";

const Verify = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await verifyCode(email, code);
      if (data.token) {
        sessionStorage.setItem("resetToken", data.token); // Store token
        navigate("/setpassword");
      } else {
        setError(data.message || "Invalid code");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="verify-container" style={{ display:"flex",flexDirection:"column"}
    }>
      <h1>Verify Code</h1>
      <p>Enter the 6-digit code sent to {email}</p>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
};

export default Verify;
