const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Save OTP to memory (replace with Redis for production)
const storeOTP = (email, otp) => {
  otpStore.set(email, otp);
  setTimeout(() => otpStore.delete(email), 300000); // Expire in 5 min
};

// Validate OTP
const validateOTP = (email, code) => otpStore.get(email) === code;

module.exports = { generateOTP, storeOTP, validateOTP };
