const API_URL = "http://138.197.27.240:5001/api/auth"; // Change for production

// Forgot Password - Send OTP
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return response.json();
};

// Verify OTP
export const verifyCode = async (email, code) => {
  const response = await fetch(`${API_URL}/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  return response.json();
};

// Reset Password
export const resetPassword = async (token, password) => {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  return response.json();
};
