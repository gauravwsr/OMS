const moment = require("moment-timezone");
const {
  validateCheckInTime,
  getCurrentISTTime,
} = require("./utils/attendanceTimeValidation");

console.log("🔍 Testing Late Check-in Validation Messages");
console.log("============================================\n");

// Test current time
const currentTime = getCurrentISTTime();
console.log(`Current IST Time: ${currentTime.format("YYYY-MM-DD HH:mm:ss")}`);
console.log(`Current Time Only: ${currentTime.format("HH:mm")}`);
console.log(`Is Past 11:00 AM: ${currentTime.hour() >= 11}`);

// Test check-in validation for current time
const validation = validateCheckInTime();
console.log("\nCurrent Time Validation:");
console.log(`Status: ${validation.status}`);
console.log(`Allowed: ${validation.isAllowed}`);
console.log(`Message: "${validation.message}"`);
console.log(`IsHalfDay: ${validation.isHalfDay}`);
console.log(`IsLate: ${validation.isLate}`);

// Test specific late times
const testTimes = ["11:05", "11:30", "12:00", "13:00"];

console.log("\n📋 Testing Specific Late Times:");
console.log("================================");

testTimes.forEach((timeStr) => {
  const testTime = moment.tz(`2024-01-15 ${timeStr}:00`, "Asia/Kolkata");
  const testValidation = validateCheckInTime(testTime);

  console.log(`\n⏰ Testing ${timeStr}:`);
  console.log(`  Status: ${testValidation.status}`);
  console.log(`  Allowed: ${testValidation.isAllowed}`);
  console.log(`  Message: "${testValidation.message}"`);
  console.log(`  Hour (24h format): ${testTime.hour()}`);
  console.log(`  Formatted: ${testTime.format("HH:mm")}`);
  console.log(`  12-hour format: ${testTime.format("h:mm A")}`);
});

console.log("\n✅ Message Validation Test Complete!");
