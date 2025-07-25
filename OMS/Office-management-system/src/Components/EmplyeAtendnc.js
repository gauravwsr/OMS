// import "./EmplyeAtendnc.css"
// import Navbar from "./Navbar";
// export default function EmployeeAttendance() {

    
//   return (
// <div className="main-cont">
// {/* <Navbar /> */}
//     <div className="employee-attendance">
//       {/* <Navbar /> */}
//         <h2>Employee</h2>
//       {/* Header Section */}
//       <div className="parent-container">
//   {/* Main container on the left */}
//   <div className="main-container">
//     <div className="info-container">
//       <div className="time-details">
//         <div className="label">Starting Time</div>
//         <div className="value">10:11 AM</div>
//       </div>

//       {/* Centered Image */}
//       <div className="image-container">
//         <img 
//           src="Images/Group 32.png" 
//           alt="Centered Image" 
//         />
//       </div>

//       <div className="date-details">
//         <div className="label">10 August 2024</div>
//         <div className="value">Today</div>
//       </div>
//     </div>
//   </div>

//   {/* Employee Info container on the right */}

//     <div className="employee-details">
//       <h1 className="employee-name">Danish Zain</h1>
    
//       <div className="employee-meta">
//         <div>
//           <div className="meta-label">Employee Id:12345</div>
//         </div>
//         <div>
//           <div className="meta-label">Department:Developer</div>
//         </div>
//         <div>
//         <div className="meta-label">Position:Web Developer</div>
    
//         </div>
//       </div>
//     </div>
//     <div className="employee-photo">
//       <img
//         src="Images/qwe.png"
//         alt="Employee photo"
//       />
//     </div>
//   </div>


// <div className="attendance-summary">
//   <div className="headeryy">
//     <h2>Attendance Summary</h2>
//   </div>
//   <div className="summary-grid">
//     <div>
//       <div className="summary-label">Month</div>
//       <div className="summary-value">July 2024</div>
//       <div className="summary-value">August 2024</div>
//     </div>
//     <div>
//       <div className="summary-label">Present Days</div>
//       <div className="summary-value">2</div>
//       <div className="summary-value">3</div>
//     </div>
//     <div>
//       <div className="summary-label">Leave Taken</div>
//       <div className="summary-value">1</div>
//       <div className="summary-value">2</div>
//     </div>
//   </div>
// </div>


//       {/* Attendance Table */}
//       <div className="attendance-table">
//         <div className="table-header">
//           <h2>Monthly Overview of the employee attendance</h2>
//         </div>
//         <table>
//           <thead>
//             <tr>
//               <th>Date</th>
//               <th>Day</th>
//               <th>Attendance status</th>
//               <th>Leave Type</th>
//             </tr>
//           </thead>
//           <tbody>
//   {[
//     { date: "August 5, 2024", day: "Monday", status: "Present", hours: "None" },
//     { date: "August 6, 2024", day: "Tuesday", status: "Absent", hours: "Sick Leave" },
//     { date: "August 7, 2024", day: "Wednesday", status: "Present", hours: "None" },
//     { date: "August 8, 2024", day: "Thursday", status: "Present", hours: "Sick Leave" },
//     { date: "August 9, 2024", day: "Friday", status: "Absent", hours: "None" },
//   ].map((row, idx) => (
//     <tr key={idx}>
//       <td>{row.date}</td>
//       <td>{row.day}</td>
//       <td>
//         <span className={`status-badge ${row.status === "Absent" ? "absent" : ""}`}>
//           {row.status}
//         </span>
//       </td>
//       <td className={row.hours === "Sick Leave" ? "hours-type sick-leave" : ""}>
//         {row.hours}
//       </td>
//     </tr>
//   ))}
// </tbody>
// </table>
// </div>
//     </div>
//     </div>
//   )
// }


import React from 'react';
import './EmplyeAtendnc.css';

export default function EmployeeAttendance() {
  const attendanceData = [
    { date: "August 1, 2024", day: "Thursday", status: "Present", hours: "None" },
    { date: "August 2, 2024", day: "Friday", status: "Absent", hours: "Sick Leave" },
    { date: "August 5, 2024", day: "Monday", status: "Present", hours: "None" },
    { date: "August 6, 2024", day: "Tuesday", status: "Present", hours: "None" },
    { date: "August 7, 2024", day: "Wednesday", status: "Absent", hours: "Sick Leave" },
    { date: "August 8, 2024", day: "Thursday", status: "Present", hours: "None" }
  ];

  const employeeData = {
    name: "Danish Zain",
    employeeId: "12345",
    department: "Developer",
    position: "Web Developer",
    attendanceRecords: attendanceData
  };

  const monthlyAttendance = [
    { month: "Jul 2024", presentDays: 25, leaveTaken: 5 },
    { month: "Aug 2024", presentDays: 24, leaveTaken: 4 },
    { month: "Sep 2024", presentDays: 20, leaveTaken: 6 },
    { month: "Oct 2024", presentDays: 28, leaveTaken: 2 },
    { month: "Nov 2024", presentDays: 20, leaveTaken: 10 },
    { month: "Dec 2024", presentDays: 29, leaveTaken: 1 }
  ];

  const handleBackToList = () => {
    console.log("Back to Employee List");
  };

  return (
    <div className="attendance-page">
      <div className="attendance-container">
        <div className="attendance-header">
          <div className="header-left">
            <div className="header-illustration">
              <img src="/api/placeholder/150/150" alt="Employee Illustration" />
            </div>
            <div className="header-time-info">
              <div className="label">Current Time</div>
              <div className="time">10:11 AM</div>
              <div className="date">10 August 2024</div>
              <div className="today">Today</div>
            </div>
          </div>
          
          <div className="header-right">
            <div className="employee-info">
              <div className="employee-name">{employeeData.name}</div>
              <div className="employee-details">
                <div>Employee ID: {employeeData.employeeId}</div>
                <div>Department: {employeeData.department}</div>
                <div>Position: {employeeData.position}</div>
              </div>
            </div>
            <div className="employee-photo">
              <img src="/api/placeholder/100/100" alt="Employee" />
            </div>
          </div>
        </div>
        
        <div className="attendance-summary">
          <div className="summary-header">
            <h2>Attendance Summary</h2>
            <a href="#" className="see-all">See All</a>
          </div>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Present Days</th>
                <th>Leave Taken</th>
              </tr>
            </thead>
            <tbody>
              {monthlyAttendance.map((record, index) => (
                <tr key={index}>
                  <td>{record.month}</td>
                  <td>{record.presentDays}</td>
                  <td>{record.leaveTaken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="attendance-table">
          <div className="table-header">
            <h2>Weekly Overview of the Employee Attendance</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Attendance Status</th>
                <th>Leave Type</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.date}</td>
                  <td>{row.day}</td>
                  <td>
                    <span className={`status-badge ${row.status === "Absent" ? "absent" : "present"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className={row.hours === "Sick Leave" ? "hours-type sick-leave" : ""}>
                    {row.hours}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="back-button-container">
          <button 
            onClick={handleBackToList} 
            className="back-btn"
          >
            Back to Employee List
          </button>
        </div>
      </div>
    </div>
  );
}