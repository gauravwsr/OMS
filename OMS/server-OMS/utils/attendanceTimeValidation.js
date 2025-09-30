const moment = require("moment-timezone");

// Set timezone to IST (Indian Standard Time)
const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Get current time in IST
 */
const getCurrentISTTime = () => {
  return moment().tz(IST_TIMEZONE);
};

/**
 * Validate check-in time based on business rules
 * Rules:
 * - Before 10:30 AM: Normal check-in (Present - Full Day)
 * - 10:30 AM - 11:00 AM: Late check-in (Late Mark - Half Day)
 * - After 11:00 AM: No check-in allowed (Absent)
 */
const validateCheckInTime = (currentTime = null) => {
  const now = currentTime || getCurrentISTTime();
  const hour = now.hour();
  const minute = now.minute();
  const currentTimeString = now.format("HH:mm");

  // Convert time to minutes for easier comparison
  const currentMinutes = hour * 60 + minute;
  const checkInCutoff = 13 * 60 + 30; // 10:30 AM
  const lateCutoff = 14 * 60; // 11:00 AM

  let validation = {
    isAllowed: false,
    status: "Absent",
    message: "",
    currentTime: currentTimeString,
    currentDateTime: now.format("YYYY-MM-DD HH:mm:ss"),
    isHalfDay: false,
    isLate: false,
  };

  if (currentMinutes < checkInCutoff) {
    // Before 10:30 AM - Normal check-in
    validation.isAllowed = true;
    validation.status = "Present";
    validation.message = "Check-in allowed. Status: Present (Full Day)";
    validation.isHalfDay = false;
    validation.isLate = false;
  } else if (currentMinutes >= checkInCutoff && currentMinutes < lateCutoff) {
    // 10:30 AM - 11:00 AM - Late check-in
    validation.isAllowed = true;
    validation.status = "Late";
    validation.message = "Late check-in allowed. Status: Late Mark (Half Day)";
    validation.isHalfDay = true;
    validation.isLate = true;
  } else {
    // After 11:00 AM - No check-in allowed
    validation.isAllowed = false;
    validation.status = "Absent";
    validation.message = "Check-in not allowed after 11:00 AM. Status: Absent";
    validation.isHalfDay = false;
    validation.isLate = false;
  }

  return validation;
};

/**
 * Validate check-out time based on business rules
 * Rules:
 * - Check-out is allowed only after 8 hours from check-in time
 */
const validateCheckOutTime = (checkInTime, currentTime = null) => {
  const now = currentTime || getCurrentISTTime();
  const checkIn = moment(checkInTime).tz(IST_TIMEZONE);

  // Calculate 8 hours from check-in time
  const minimumCheckOutTime = checkIn.clone().add(8, "hours");
  const currentDateTime = now;

  // Calculate worked hours
  const workedDuration = moment.duration(currentDateTime.diff(checkIn));
  const workedHours = workedDuration.asHours();
  const workedHoursFloor = Math.floor(workedHours);
  const workedMinutes = Math.floor((workedHours - workedHoursFloor) * 60);

  let validation = {
    isAllowed: false,
    message: "",
    checkInTime: checkIn.format("HH:mm"),
    currentTime: now.format("HH:mm"),
    currentDateTime: now.format("YYYY-MM-DD HH:mm:ss"),
    minimumCheckOutTime: minimumCheckOutTime.format("HH:mm"),
    workedHours: workedHoursFloor,
    workedMinutes: workedMinutes,
    totalWorkedHours: workedHours.toFixed(2),
    remainingTime: null,
  };

  if (currentDateTime.isSameOrAfter(minimumCheckOutTime)) {
    // Check-out allowed
    validation.isAllowed = true;
    validation.message = `Check-out allowed. You have worked for ${workedHoursFloor}h ${workedMinutes}m`;
  } else {
    // Check-out not allowed - calculate remaining time
    const remainingDuration = moment.duration(
      minimumCheckOutTime.diff(currentDateTime)
    );
    const remainingHours = Math.floor(remainingDuration.asHours());
    const remainingMinutes = Math.floor(remainingDuration.asMinutes() % 60);

    validation.isAllowed = false;
    validation.message = `You can only check-out after completing 8 hours from your check-in time. Please wait ${remainingHours}h ${remainingMinutes}m more.`;
    validation.remainingTime = {
      hours: remainingHours,
      minutes: remainingMinutes,
      totalMinutes: Math.ceil(remainingDuration.asMinutes()),
    };
  }

  return validation;
};

/**
 * Check if user has already checked in/out today
 */
const validateDuplicateAttendance = (todayAttendance, requestedType) => {
  let validation = {
    isAllowed: false,
    message: "",
    existingRecords: null,
  };

  if (requestedType === "check_in") {
    if (todayAttendance.hasCheckIn) {
      validation.isAllowed = false;
      validation.message =
        "You have already checked in today. Please check-out to complete your attendance.";
      validation.existingRecords = {
        checkIn: todayAttendance.checkInRecord,
        hasCheckOut: todayAttendance.hasCheckOut,
      };
    } else {
      validation.isAllowed = true;
      validation.message = "Check-in validation passed.";
    }
  } else if (requestedType === "check_out") {
    if (!todayAttendance.hasCheckIn) {
      validation.isAllowed = false;
      validation.message = "You must check-in first before checking out.";
    } else if (todayAttendance.hasCheckOut) {
      validation.isAllowed = false;
      validation.message =
        "You have already checked out today. Attendance is complete.";
      validation.existingRecords = {
        checkIn: todayAttendance.checkInRecord,
        checkOut: todayAttendance.checkOutRecord,
        workingHours: todayAttendance.workingHours,
      };
    } else {
      validation.isAllowed = true;
      validation.message = "Check-out validation passed.";
    }
  }

  return validation;
};

/**
 * Get comprehensive attendance validation
 */
const getAttendanceValidation = (
  attendanceType,
  todayAttendance,
  currentTime = null
) => {
  const now = currentTime || getCurrentISTTime();

  // Check for duplicate attendance
  const duplicateValidation = validateDuplicateAttendance(
    todayAttendance,
    attendanceType
  );
  if (!duplicateValidation.isAllowed) {
    return {
      isValid: false,
      type: "DUPLICATE_ATTENDANCE",
      ...duplicateValidation,
    };
  }

  if (attendanceType === "check_in") {
    const timeValidation = validateCheckInTime(now);
    return {
      isValid: timeValidation.isAllowed,
      type: timeValidation.isAllowed
        ? "CHECK_IN_ALLOWED"
        : "CHECK_IN_NOT_ALLOWED",
      ...timeValidation,
    };
  } else if (attendanceType === "check_out") {
    if (!todayAttendance.hasCheckIn || !todayAttendance.checkInRecord) {
      return {
        isValid: false,
        type: "NO_CHECK_IN_FOUND",
        message: "You must check-in first before checking out.",
        currentTime: now.format("HH:mm"),
        currentDateTime: now.format("YYYY-MM-DD HH:mm:ss"),
      };
    }

    const timeValidation = validateCheckOutTime(
      todayAttendance.checkInRecord.timestamp,
      now
    );
    return {
      isValid: timeValidation.isAllowed,
      type: timeValidation.isAllowed
        ? "CHECK_OUT_ALLOWED"
        : "CHECK_OUT_NOT_ALLOWED",
      ...timeValidation,
    };
  }

  return {
    isValid: false,
    type: "INVALID_ATTENDANCE_TYPE",
    message: "Invalid attendance type. Must be either check_in or check_out.",
    currentTime: now.format("HH:mm"),
    currentDateTime: now.format("YYYY-MM-DD HH:mm:ss"),
  };
};

module.exports = {
  getCurrentISTTime,
  validateCheckInTime,
  validateCheckOutTime,
  validateDuplicateAttendance,
  getAttendanceValidation,
  IST_TIMEZONE,
};
