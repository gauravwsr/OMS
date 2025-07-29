// controllers/exportController.js
import ExcelJS from "exceljs";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";

export const exportToExcel = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const attendanceSheet = workbook.addWorksheet("Attendance");
    const leaveSheet = workbook.addWorksheet("Leaves");

    const attendanceData = await Attendance.find();
    const leaveData = await Leave.find();

    attendanceSheet.columns = [
      { header: "Employee ID", key: "employeeId" },
      { header: "Date", key: "date" },
      { header: "Check In", key: "checkIn" },
      { header: "Check Out", key: "checkOut" },
    ];

    leaveSheet.columns = [
      { header: "Employee ID", key: "employeeId" },
      { header: "Type", key: "type" },
      { header: "From", key: "startDate" },
      { header: "To", key: "endDate" },
      { header: "Status", key: "status" },
    ];

    attendanceData.forEach(record => attendanceSheet.addRow(record));
    leaveData.forEach(record => leaveSheet.addRow(record));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=employee-data.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
