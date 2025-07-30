import React, { useRef, useEffect, useState } from "react";
import Navbar from "../Navbar";
import { DataManager, UrlAdaptor } from "@syncfusion/ej2-data";
import {
  ScheduleComponent,
  ResourcesDirective,
  ResourceDirective,
  ViewsDirective,
  ViewDirective,
  Day,
  Week,
  WorkWeek,
  Month,
  Agenda,
  Inject,
  DragAndDrop,
} from "@syncfusion/ej2-react-schedule";
import axios from "axios";
import { useAuth } from "../AuthProvider/AuthContext";


const Calender = () => {
  const scheduleObj = useRef(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/GetData");
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching calendar events:", error);
      }
    };
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/users");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchEvents();
    fetchUsers();
  }, []);

  // Defensive: ensure all events have Users as array of valid user IDs
  const validUserIds = new Set(users.map(u => u._id));
  const safeEvents = events.map(ev => {
    let usersArr = Array.isArray(ev.Users)
      ? ev.Users
      : (ev.Users ? [ev.Users] : []);
    // Only keep IDs that exist in users
    usersArr = usersArr.filter(id => validUserIds.has(id));
    return { ...ev, Users: usersArr };
  });

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ScheduleComponent
        width={"100%"}
        height={"calc(100% - 60px)"}
        id="schedule"
        ref={scheduleObj}
        currentView="Week"
        eventSettings={{ dataSource: safeEvents, resourceColorField: "Users" }}
      >
        <ResourcesDirective>
          <ResourceDirective
            field="Users"
            title="Users"
            name="Users"
            idField="_id"
            textField="name"
            allowMultiple={true}
            dataSource={users}
          />
        </ResourcesDirective>
        <ViewsDirective>
          <ViewDirective option="Day" />
          <ViewDirective option="Week" />
          <ViewDirective option="WorkWeek" />
          <ViewDirective option="Month" />
          <ViewDirective option="Agenda" />
        </ViewsDirective>
        <Inject services={[Day, Week, WorkWeek, Month, Agenda, DragAndDrop]} />
      </ScheduleComponent>
    </div>
  );
};

export default Calender;
        
