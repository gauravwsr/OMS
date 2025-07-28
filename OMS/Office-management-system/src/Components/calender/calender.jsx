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
  const { user } = useAuth(); // Get user info to check role

  // Check if current user is Super Admin
  const isSuperAdmin = user?.role === 'Super_Admin';

  // Create DataManager with custom configuration
  const dataManager = React.useMemo(() => {
    const token = localStorage.getItem("token");
    console.log('Calendar DataManager - Token available:', !!token);
    console.log('Calendar DataManager - Is Super Admin:', isSuperAdmin);
    
    if (isSuperAdmin) {
      return new DataManager({
        url: "http://localhost:5000/GetData",
        adaptor: new UrlAdaptor(),
        crossDomain: true,
      });
    }
    
    return new DataManager({
      url: "http://localhost:5000/GetData",
      crudUrl: "http://localhost:5000/BatchData",
      adaptor: new UrlAdaptor(),
      crossDomain: true,
      headers: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json"
      },
      beforeSend: (dm, request, settings) => {
        console.log('Calendar beforeSend - Operation:', request.httpRequest.requestType);
        const currentToken = localStorage.getItem("token");
        if (currentToken) {
          console.log('Calendar beforeSend - Setting authorization header');
          request.httpRequest.setRequestHeader("Authorization", `Bearer ${currentToken}`);
          request.httpRequest.setRequestHeader("Content-Type", "application/json");
        } else {
          console.log('Calendar beforeSend - No token found');
        }
      },
      actionComplete: (e) => {
        console.log('Calendar Action Complete:', e);
        if (e.action === 'insert' || e.action === 'batch') {
          console.log('Calendar - Event created, notifications should be triggered');
        }
      }
    });
  }, [user, isSuperAdmin]);

  // Function to manually refresh calendar data
  const refreshCalendar = () => {
    if (scheduleObj.current) {
      scheduleObj.current.refreshEvents();
      console.log('📅 Calendar refreshed - finished events should be removed');
    }
  };

  // Event handlers for Super Admin restrictions
  const onActionBegin = (args) => {
    // Prevent all editing actions for Super Admin
    if (isSuperAdmin && (args.requestType === 'eventCreate' || 
        args.requestType === 'eventChange' || 
        args.requestType === 'eventRemove')) {
      args.cancel = true;
      console.log('Action prevented: Super Admin has read-only access to calendar');
    }
  };

  const onCellClick = (args) => {
    // Prevent cell click actions for Super Admin
    if (isSuperAdmin) {
      args.cancel = true;
    }
  };

  const onEventClick = (args) => {
    // Prevent event click editing for Super Admin
    if (isSuperAdmin) {
      args.cancel = true;
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
      {/* Refresh Button - Show for all users but with different styling for Super Admin */}
      <div style={{ 
        padding: '10px', 
        textAlign: 'right', 
        backgroundColor: isSuperAdmin ? '#fff3cd' : '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        {isSuperAdmin && (
          <span style={{
            marginRight: '15px',
            color: '#856404',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            📋 Read-Only Mode (Super Admin View)
          </span>
        )}
        <button 
          onClick={refreshCalendar}
          style={{
            padding: '8px 16px',
            backgroundColor: isSuperAdmin ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title={isSuperAdmin ? "Refresh calendar view" : "Refresh calendar and remove finished events"}
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
        group={{ allowGroupEdit: !isSuperAdmin }} // Disable group editing for Super Admin
        allowDragAndDrop={!isSuperAdmin} // Disable drag and drop for Super Admin
        readonly={isSuperAdmin} // Make entire schedule readonly for Super Admin
        eventSettings={{ dataSource: dataManager }} // Event data source
        actionBegin={onActionBegin} // Handle action restrictions
        cellClick={onCellClick} // Handle cell click restrictions
        eventClick={onEventClick} // Handle event click restrictions
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
