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

  // Check if current user can edit calendar (Super Admin or HR Admin)
  const canEditCalendar = user?.role === 'Super_Admin' || 
                         (user?.role === 'Admin' && user?.subRole?.includes('HR'));

  // Create DataManager with custom configuration
  const dataManager = React.useMemo(() => {
    const token = localStorage.getItem("token");
    console.log('Calendar DataManager - Token available:', !!token);
    console.log('Calendar DataManager - Can Edit Calendar:', canEditCalendar);
    console.log('Calendar DataManager - User Role:', user?.role);
    
    // Both Super Admin and HR Admin can edit calendar
    if (canEditCalendar) {
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
          console.log('Calendar beforeSend - User:', user?.name, user?.role);
          const currentToken = localStorage.getItem("token");
          if (currentToken) {
            console.log('Calendar beforeSend - Setting authorization header');
            request.httpRequest.setRequestHeader("Authorization", `Bearer ${currentToken}`);
            request.httpRequest.setRequestHeader("Content-Type", "application/json");
          } else {
            console.log('Calendar beforeSend - No token found');
          }
        }
      });
    }
    
    // Read-only access for other users
    return new DataManager({
      url: "http://localhost:5000/GetData",
      adaptor: new UrlAdaptor(),
      crossDomain: true,
    });
  }, [user, canEditCalendar]);

  // Function to manually refresh calendar data
  const refreshCalendar = () => {
    if (scheduleObj.current) {
      scheduleObj.current.refreshEvents();
      console.log('📅 Calendar refreshed - finished events should be removed');
    }
  };

  // Event handlers - now both Super Admin and HR Admin can edit
  const onActionBegin = (args) => {
    // Allow editing for Super Admin and HR Admin
    if (!canEditCalendar && (args.requestType === 'eventCreate' || 
        args.requestType === 'eventChange' || 
        args.requestType === 'eventRemove')) {
      args.cancel = true;
      console.log('Action prevented: User does not have calendar edit permissions');
    } else if (canEditCalendar) {
      console.log('Calendar action allowed for:', user?.role, args.requestType);
    }
  };

  const onCellClick = (args) => {
    // Allow cell click for users with edit permissions
    if (!canEditCalendar) {
      args.cancel = true;
    }
  };

  const onEventClick = (args) => {
    // Allow event click editing for users with edit permissions
    if (!canEditCalendar) {
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
        backgroundColor: user?.role === 'Super_Admin' ? '#fff3cd' : '#f8f9fa',
        borderBottom: '1px solid #dee2e6'
      }}>
        
        <button 
          onClick={refreshCalendar}
          style={{
            padding: '8px 16px',
            backgroundColor: user?.role === 'Super_Admin' ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
          title={user?.role === 'Super_Admin' ? "Refresh calendar view" : "Refresh calendar and remove finished events"}
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
        group={{ allowGroupEdit: canEditCalendar }} // Allow group editing for Super Admin and HR
        allowDragAndDrop={canEditCalendar} // Allow drag and drop for Super Admin and HR
        readonly={!canEditCalendar} // Make schedule readonly for users without edit permission
        eventSettings={{ dataSource: dataManager }} // Event data source
        actionBegin={onActionBegin} // Handle action permissions
        cellClick={onCellClick} // Handle cell click permissions
        eventClick={onEventClick} // Handle event click permissions
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
