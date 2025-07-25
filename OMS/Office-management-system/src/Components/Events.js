import React, { useState } from "react";
import "./Events.css";

const meetings = [
  { title: "Strategy Review", date: "22/08/2024", time: "10:00 AM", location: "Room 201", participants: "Team A, B" },
  { title: "Product Launch Prep", date: "23/08/2024", time: "02:30 PM", location: "Room 104", participants: "Marketing Team" },
  { title: "Strategy Review", date: "23/08/2024", time: "10:00 AM", location: "Room 201", participants: "Team A, B" },
  { title: "Product Launch Prep", date: "24/08/2024", time: "02:30 PM", location: "Room 104", participants: "Marketing Team" },
  { title: "Strategy Review", date: "25/08/2024", time: "10:00 AM", location: "Room 201", participants: "Team A, B" },
  { title: "Product Launch Prep", date: "26/08/2024", time: "02:30 PM", location: "Room 104", participants: "Marketing Team" }
];

const Events = () => {
  return (
    <div className="meeting-container">
      <h2 className="meeting-header">Upcoming Meetings this Month</h2>
      <table className="meeting-table">
        <thead>
          <tr>
            <th>Meeting Title</th>
            <th>Meeting Date</th>
            <th>Time</th>
            <th>Location</th>
            <th>Participants</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting, index) => (
            <tr key={index}>
              <td>{meeting.title}</td>
              <td>{meeting.date}</td>
              <td>{meeting.time}</td>
              <td>{meeting.location}</td>
              <td>{meeting.participants}</td>
              <td><button className="details-button">View Details</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Events;