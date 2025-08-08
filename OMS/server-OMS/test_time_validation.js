const moment = require("moment-timezone");
const {
  validateCheckInTime,
  validateCheckOutTime,
  getAttendanceValidation,
  getCurrentISTTime,
} = require("./utils/attendanceTimeValidation");

console.log("🚀 Testing Attendance Time Validation System\n");

// Test different check-in times
const testTimes = [
  "08:30", // Early morning - should be allowed
  "09:15", // Normal time - should be allowed
  "10:15", // Still on time - should be allowed
  "10:35", // Late but allowed - half day
  "10:55", // Very late but still allowed - half day
  "11:05", // Too late - not allowed
  "11:30", // Way too late - not allowed
  "14:00", // Afternoon - not allowed
];

console.log("📋 CHECK-IN TIME VALIDATION TESTS:");
console.log("=====================================");

testTimes.forEach((timeStr) => {
  // Create a test time for today
  const testTime = moment.tz(`2024-01-15 ${timeStr}:00`, "Asia/Kolkata");
  const validation = validateCheckInTime(testTime);

  const icon = validation.isAllowed ? "✅" : "❌";
  const statusIcon =
    validation.status === "Present"
      ? "🟢"
      : validation.status === "Late"
      ? "🟡"
      : "🔴";

  console.log(
    `${icon} ${timeStr} - ${statusIcon} ${validation.status} ${
      validation.isHalfDay ? "(Half Day)" : "(Full Day)"
    }`
  );
  console.log(`   Message: ${validation.message}\n`);
});

console.log("\n📋 CHECK-OUT TIME VALIDATION TESTS:");
console.log("====================================");

// Test check-out scenarios
const checkInTimes = [
  { time: "09:00", label: "Normal 9 AM check-in" },
  { time: "10:30", label: "Late 10:30 AM check-in" },
];

const checkOutTimes = [
  "13:00", // 4 hours after 9 AM check-in
  "15:00", // 6 hours after 9 AM check-in
  "17:00", // 8 hours after 9 AM check-in
  "17:30", // 8.5 hours after 9 AM check-in
];

checkInTimes.forEach((checkInScenario) => {
  console.log(`\nScenario: ${checkInScenario.label}`);
  const checkInTime = moment.tz(
    `2024-01-15 ${checkInScenario.time}:00`,
    "Asia/Kolkata"
  );

  checkOutTimes.forEach((checkOutTimeStr) => {
    const checkOutTime = moment.tz(
      `2024-01-15 ${checkOutTimeStr}:00`,
      "Asia/Kolkata"
    );
    const validation = validateCheckOutTime(checkInTime, checkOutTime);

    const icon = validation.isAllowed ? "✅" : "❌";
    const workedHours = validation.totalWorkedHours;

    console.log(
      `  ${icon} ${checkOutTimeStr} - Worked: ${validation.workedHours}h ${validation.workedMinutes}m`
    );
    if (!validation.isAllowed && validation.remainingTime) {
      console.log(
        `      Need to wait: ${validation.remainingTime.hours}h ${validation.remainingTime.minutes}m more`
      );
    }
  });
});

console.log("\n🕐 CURRENT IST TIME:");
console.log("====================");
const currentTime = getCurrentISTTime();
console.log(`Current IST Time: ${currentTime.format("YYYY-MM-DD HH:mm:ss")}`);
console.log(`Time only: ${currentTime.format("HH:mm")}`);
console.log(`Day: ${currentTime.format("dddd")}`);

// Test current time validation
const currentCheckInValidation = validateCheckInTime();
console.log(`\nCurrent time check-in validation:`);
console.log(`Status: ${currentCheckInValidation.status}`);
console.log(`Allowed: ${currentCheckInValidation.isAllowed ? "Yes" : "No"}`);
console.log(`Message: ${currentCheckInValidation.message}`);

console.log("\n✅ Attendance Time Validation Tests Complete!");
console.log("\nRules Summary:");
console.log("- Before 10:30 AM: ✅ Present (Full Day)");
console.log("- 10:30-11:00 AM: ⚠️ Late (Half Day)");
console.log("- After 11:00 AM: ❌ Absent (Not Allowed)");
console.log("- Check-out: Only after 8 hours from check-in");
