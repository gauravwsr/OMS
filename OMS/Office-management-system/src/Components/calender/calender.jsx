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

  // Check if current user is Super Admin, Admin, or HR Manager
  const isSuperAdmin = user?.role === 'Super_Admin';
  const isAdmin = user?.role === 'Admin';
  // Check if current user is HR Manager (Admin with HR Manager subRole)
  const isHRManager = user?.role === "Admin" && user?.subRole === "HR Manager";

  console.log('Calendar User Info:', {
    userName: user?.name,
    role: user?.role,
    subRole: user?.subRole,
    isSuperAdmin: isSuperAdmin,
    isAdmin: isAdmin,
    isHRManager: isHRManager
  });

  // HR Manager uses regular GetData route (backend will handle showing all events)
  const baseUrl = "http://142.93.213.81:5001/GetData";

  class CustomAuthAdaptor extends UrlAdaptor {
    processQuery(dm, query, hierarchyFilters) {
      const request = super.processQuery(dm, query, hierarchyFilters);
      const token = localStorage.getItem("token");

      if (token) {
        request.headers = {
          ...request.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        console.log("✅ CustomAdaptor - Injected Authorization header");
      } else {
        console.warn("❌ CustomAdaptor - No token found");
      }

      return request;
    }
  }

  // Create DataManager with custom configuration
  const dataManager = React.useMemo(() => {
    const token = localStorage.getItem("token");
    console.log('Calendar DataManager - Token available:', !!token);
    console.log('Calendar DataManager - Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('Calendar DataManager - Is Super Admin:', isSuperAdmin);
    console.log('Calendar DataManager - Is Admin:', isAdmin);
    console.log('Calendar DataManager - Is HR Manager:', isHRManager);
    console.log('Calendar DataManager - User object:', user);
    console.log('Calendar DataManager - Using URL:', baseUrl);

    if (!token) {
      console.error('❌ No token found in localStorage! User needs to login again.');
      return null;
    }

    return new DataManager({
      url: baseUrl,

      // crudUrl: "http://142.93.213.81:5000/BatchData",
      // adaptor: new CustomAuthAdaptor(),
      crudUrl: "http://142.93.213.81:5001/BatchData",
      adaptor: new UrlAdaptor(),

      crossDomain: true,
      requestType: 'POST',

      beforeSend: (dm, request) => {
        console.log('Calendar beforeSend - Operation:', request.httpRequest.requestType);
        console.log('Calendar beforeSend - User Role:', user?.role, 'SubRole:', user?.subRole);
        console.log('Calendar beforeSend - URL:', request.url);

        const currentToken = localStorage.getItem("token");
        console.log('Calendar beforeSend - Token available:', !!currentToken);

        if (currentToken) {
          request.httpRequest.setRequestHeader("Authorization", `Bearer ${currentToken}`);
          request.httpRequest.setRequestHeader("Content-Type", "application/json");

          console.log('✅ Authorization header set for DataManager request.');
        } else {
          console.error('❌ No token found in localStorage during beforeSend!');
        }

        // Log all headers being sent
        console.log('Calendar beforeSend - All headers:', {
          authorization: request.httpRequest.getRequestHeader('Authorization'),
          contentType: request.httpRequest.getRequestHeader('Content-Type')
        });
      }
    });
  }, [user, isAdmin, isHRManager, baseUrl]);

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

  // Test token validity
  useEffect(() => {
    const testToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found in localStorage");
        return;
      }

      try {
        console.log("🔍 Testing token validity...");
        console.log("🔍 Token preview:", token.substring(0, 30) + "...");

        // const response = await fetch("http://142.93.213.81:5000/users/me", {
      
        const response = await fetch("http://142.93.213.81:5001/users/me", {

          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log("✅ Token is valid. User data:", userData);
        } else {
          console.log("❌ Token test failed:", response.status, response.statusText);
          const errorText = await response.text();
          console.log("❌ Error response:", errorText);

          if (response.status === 401) {
            console.log("🔄 Token expired or invalid. User should re-login.");
            // Optionally clear the invalid token
            // localStorage.removeItem("token");
          }
        }
      } catch (error) {
        console.error("❌ Token test error:", error);
      }
    };

    testToken();
  }, []);

  // Debug user context
  useEffect(() => {
    console.log("🔍 Calendar - User context updated:", {
      user: user,
      isAuthenticated: !!user,
      role: user?.role,
      subRole: user?.subRole,
      userId: user?._id
    });
  }, [user]);

  // Fetch users data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const response = await axios.get("http://142.93.213.81:5001/users");
        setUsers(response.data); // Set the room data to state
      } catch (error) {
        console.error("Error fetching room data:", error);
      }
    };

    fetchRoomData();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {!dataManager ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          fontSize: '18px',
          color: '#666'
        }}>
          Please login to access the calendar
        </div>
      ) : (
        <ScheduleComponent
          width={"100%"}
          height={"calc(100% - 60px)"}
          id="schedule"
          ref={scheduleObj}
          currentView="Week"
          group={{ allowGroupEdit: !isSuperAdmin }} // Disable group editing for Super Admin
          allowDragAndDrop={!isSuperAdmin} // Disable drag and drop for Super Admin
          readonly={isSuperAdmin} // Make entire schedule readonly for Super Admin
          eventSettings={{
            dataSource: dataManager,
            fields: {
              id: '_id',
              subject: { name: 'Subject' },
              startTime: { name: 'StartTime' },
              endTime: { name: 'EndTime' },
              description: { name: 'Description' },
              location: { name: 'Location' },
              isAllDay: { name: 'IsAllDay' },
              resourceFields: 'Users'
            }
          }} // Event data source
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
      )}
    </div>
  );
};

export default Calender;
