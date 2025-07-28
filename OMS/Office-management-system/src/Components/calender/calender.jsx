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
  const [users, setUsers] = useState([]);
  const { usersId } = useAuth(); // If needed for future use

  // DataManager instance for Schedule Component with auto-refresh
  const dataManager = new DataManager({
    url: "http://localhost:5000/GetData",
    crudUrl: "http://localhost:5000/BatchData",
    adaptor: new UrlAdaptor(),
    crossDomain: true,
  });

  // Function to manually refresh calendar data
  const refreshCalendar = () => {
    if (scheduleObj.current) {
      scheduleObj.current.refreshEvents();
      console.log('📅 Calendar refreshed - finished events should be removed');
    }
  };

  // Fetch users data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/users");
        setUsers(response.data); // Set the room data to state
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();

    // Auto-refresh calendar every 10 minutes to remove finished events
    const refreshInterval = setInterval(() => {
      refreshCalendar();
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Refresh Button */}
      <div style={{ 
        padding: '10px', 
        textAlign: 'right', 
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        <button 
          onClick={refreshCalendar}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title="Refresh calendar and remove finished events"
        >
          🔄 Refresh Calendar
        </button>
      </div>

      <ScheduleComponent
        width={"100%"}
        height={"calc(100% - 60px)"}
        id="schedule"
        ref={scheduleObj}
        currentView="Week"
        group={{ allowGroupEdit: true }}
        allowDragAndDrop={false}
        eventSettings={{ dataSource: dataManager }} // Event data source
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
