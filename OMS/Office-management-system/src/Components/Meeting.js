import { useState, useEffect, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaCopy, FaSignOutAlt, FaLink, FaUserPlus } from "react-icons/fa";
import "./Meeting.css";

const Meeting = () => {
  const callFrameRef = useRef(null);
  const containerRef = useRef(null);
  const [roomName, setRoomName] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [userName, setUserName] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [participants, setParticipants] = useState(0);

  // API key should be stored securely in environment variables in a real application
  const API_KEY = "4e0988f781f1d0eda3c64fbdda8465d5282923b87db26911019bfe637b57c1aa";

  const createRoom = async () => {
    if (!userName) {
      alert("Please enter your name before creating a meeting");
      return;
    }

    let generatedRoomName = roomName || `meeting-${Date.now()}`;

    try {
      const response = await fetch("https://api.daily.co/v1/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          name: generatedRoomName,
          privacy: "public",
          properties: {
            enable_chat: true,
            enable_knocking: true,
            start_video_off: !isVideoOn,
            start_audio_off: !isAudioOn,
          },
        }),
      });

      const data = await response.json();
      if (data?.url) {
        setRoomUrl(data.url);
        setIsMeetingStarted(true);
        joinMeetingRoom(data.url);
      } else {
        alert(data?.error || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    }
  };

  const joinMeeting = () => {
    if (!userName) {
      alert("Please enter your name before joining a meeting");
      return;
    }

    if (joinLink) {
      // Check if the link is valid
      if (joinLink.includes("daily.co")) {
        setRoomUrl(joinLink);
        setIsMeetingStarted(true);
        joinMeetingRoom(joinLink);
      } else {
        alert("Please enter a valid Daily.co meeting link");
      }
    } else {
      alert("Please enter a meeting link");
    }
  };

  const joinMeetingRoom = (url) => {
    if (containerRef.current) {
      if (!callFrameRef.current) {
        callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
          url: url,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "12px",
          },
          showLeaveButton: false,
          showFullscreenButton: true,
        });

        callFrameRef.current.on("joined-meeting", (event) => {
          console.log("Joined meeting!", event);
          updateParticipantCount();
        });

        callFrameRef.current.on("participant-joined", () => {
          updateParticipantCount();
        });

        callFrameRef.current.on("participant-left", () => {
          updateParticipantCount();
        });

        callFrameRef.current.join({
          url: url,
          userName: userName,
          startVideoOff: !isVideoOn,
          startAudioOff: !isAudioOn,
        });
      }
    }
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participantsObj = callFrameRef.current.participants();
      setParticipants(Object.keys(participantsObj).length);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      const newState = !isVideoOn;
      callFrameRef.current.setLocalVideo(newState);
      setIsVideoOn(newState);
    } else {
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = () => {
    if (callFrameRef.current) {
      const newState = !isAudioOn;
      callFrameRef.current.setLocalAudio(newState);
      setIsAudioOn(newState);
    } else {
      setIsAudioOn(!isAudioOn);
    }
  };

  const endMeeting = () => {
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsMeetingStarted(false);
    setRoomUrl("");
    setJoinLink("");
    setParticipants(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomUrl);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="meeting-container">
      <div className="meeting-header">
        <h1>Video Conference</h1>
        {isMeetingStarted && (
          <div className="meeting-info">
            <span className="participant-count">
              <FaUserPlus /> {participants} participant{participants !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="meeting-content">
        {!isMeetingStarted ? (
          <div className="meeting-setup">
            <div className="setup-card">
              <h2>Start or Join a Meeting</h2>
              
              <div className="input-group">
                <label htmlFor="userName">Your Name</label>
                <input
                  id="userName"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>
              
              <div className="media-toggles">
                <button 
                  className={`media-toggle ${isVideoOn ? 'active' : ''}`} 
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
                  {isVideoOn ? 'Video On' : 'Video Off'}
                </button>
                
                <button 
                  className={`media-toggle ${isAudioOn ? 'active' : ''}`} 
                  onClick={toggleAudio}
                >
                  {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                  {isAudioOn ? 'Audio On' : 'Audio Off'}
                </button>
              </div>
              
              <div className="meeting-actions">
                <div className="action-card">
                  <h3>Create a Meeting</h3>
                  <div className="input-with-button">
                    <input
                      type="text"
                      placeholder="Enter room name (optional)"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                    />
                    <button onClick={createRoom} className="create-button">
                      <FaVideo /> Create
                    </button>
                  </div>
                </div>
                
                <div className="action-divider">OR</div>
                
                <div className="action-card">
                  <h3>Join a Meeting</h3>
                  <div className="input-with-button">
                    <input
                      type="text"
                      placeholder="Enter meeting link"
                      value={joinLink}
                      onChange={(e) => setJoinLink(e.target.value)}
                    />
                    <button onClick={joinMeeting} className="join-button">
                      <FaLink /> Join
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="meeting-active">
            <div className="video-container" ref={containerRef}></div>
            
            <div className="meeting-controls">
              <div className="control-group">
                <button
                  className={`control-button ${isVideoOn ? 'active' : ''}`}
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
                </button>
                <button
                  className={`control-button ${isAudioOn ? 'active' : ''}`}
                  onClick={toggleAudio}
                >
                  {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>
              </div>
              
              <div className="control-group">
                <button className="share-button" onClick={copyToClipboard}>
                  <FaCopy /> {isLinkCopied ? 'Copied!' : 'Copy Link'}
                </button>
                <button className="end-button" onClick={endMeeting}>
                  <FaSignOutAlt /> End Meeting
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meeting;


// import React, { useState } from "react";
// import "./Meeting.css";
// import { Clock, CheckSquare } from "lucide-react";
// import Events from "./Events";
// import Navbar from "./Navbar";
// import SearchBar from "./Search-bar/SearchBar";

// // const meetings = [
// //   { title: "Strategy Review", time: "10:30 AM", location: "Room 201", participants: "Team A, B" },
// //   { title: "Product Launch Prep", time: "12:00 PM", location: "Room 301", participants: "Marketing Team" },
// //   { title: "Strategy Review", time: "02:30 PM", location: "Room 201", participants: "Team A, B" },
// //   { title: "Product Launch Prep", time: "03:30 PM", location: "Room 301", participants: "Marketing Team" },
// // ];

// // const tasks = [
// //   { task: "Strategy Review prep", time: "10:00 AM" },
// //   { task: "Product Launch Plan", time: "02:30 PM" },
// //   { task: "Budget Analysis", time: "04:00 PM" },
// // ];

// const Meeting = () => {
//   const [isFormVisible, setFormVisible] = useState(false);
//   const [view, setView] = useState("today");
//   const [meetings, setMeetings] = useState([
//     { title: "Strategy Review", dateTime: new Date(), location: "Room 201", participants: "Team A, B" },
//     { title: "Product Launch Prep", dateTime: new Date(new Date().setDate(new Date().getDate() + 1)), location: "Room 301", participants: "Marketing Team" },
//   ]);
  
//   const [formData, setFormData] = useState({
//     title: '',
//     dateTime: '',
//     location: '',
//     participants: '',
//     description: '',
//     reminder: '',
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleSave = async (e) => {
//     e.preventDefault();
//     const newMeeting = {
//       title: formData.title,
//       dateTime: formData.dateTime,
//       location: formData.location,
//       participants: formData.participants,
//       description: formData.description,
//       reminder: formData.reminder,
//     };

//     try {
//       const response = await fetch("http://localhost:5001/api/schedule", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newMeeting),
//       });
  
//       if (response.ok) {
//         const savedMeeting = await response.json();
//         setMeetings([...meetings, savedMeeting]);
//         setFormVisible(false);
//         setFormData({ title: "", dateTime: "", location: "", participants: "", description: "", reminder: "" });
//       } else {
//         console.error("Failed to save meeting");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   };

//   const handleCancel = () => {
//     setFormVisible(false);
//   };

  
//   const today = new Date().setHours(0, 0, 0, 0);
//   const todayMeetings = meetings.filter(meeting => new Date(meeting.dateTime).setHours(0, 0, 0, 0) === today);
//   const upcomingMeetings = meetings.filter(meeting => new Date(meeting.dateTime).setHours(0, 0, 0, 0) > today);

//   return (
//     <div className="main-cont">
//     <Navbar />
//     <div className="container flex flex-col items-center min-h-screen" style={{width:"80%"}}>
//         <SearchBar/>
//       <div className="header-bar-container w-full max-w-3xl p-4 mb-6 mt-2">
//         <div className="header-bar flex justify-between w-full bg-gray-200 rounded-lg">
//           <span className="font-semibold cursor-pointer" onClick={() => setView("today")}>Today's Meetings</span>
//           <span className="font-semibold cursor-pointer" onClick={() => setView("upcoming")}>Upcoming Meetings</span>
//           {/* <span className="font-semibold cursor-pointer" onClick={() => setView("todo")}>To-Do List</span> */}
//           <button className="add-button" onClick={() => setFormVisible(true)}>
//             <span className="plus">+</span> Add New Meeting
//           </button>
//         </div>
//       </div>

//       <div className="card w-full max-w-3xl">
//         {view === "today" ? (
//           <>
//             <div className="meeting-header-container mb-4">
//               <h2 className="title">Today's Meetings</h2>
//             </div>
//             <div className="card-content">
//               <table className="meeting-table w-full">
//                 <thead>
//                   <tr>
//                     <th>Meeting Title</th>
//                     <th>Time</th>
//                     <th>Location</th>
//                     <th>Participants</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {meetings.map((meeting, index) => (
//                     <tr key={index}>
//                       <td>{meeting.title}</td>
//                       <td className="flex items-center"><Clock className="time-icon mr-1" />{new Date(meeting.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
//                       <td>{meeting.location}</td>
//                       <td>{meeting.participants}</td>
//                       <td><button className="view-button">ReSchedule</button></td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </>
//         ) : view === "upcoming" ? (
//           // <Events />
//           <>
//            <div className="meeting-header-container mb-4">
//               <h2 className="title">Upcoming Meetings</h2>
//               </div>
//               <table className="meeting-table w-full">
//                 <thead>
//                   <tr>
//                     <th>Meeting Title</th>
//                     <th>Date</th>
//                     <th>Time</th>
//                     <th>Location</th>
//                     <th>Participants</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {upcomingMeetings.map((meeting, index) => (
//                     <tr key={index}>
//                       <td>{meeting.title}</td>
//                       <td>{new Date(meeting.dateTime).toLocaleDateString()}</td>
//                       <td><Clock className="time-icon mr-1" />{new Date(meeting.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
//                       <td>{meeting.location}</td>
//                       <td>{meeting.participants}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </>
//         ) : null(
//           // <div className="todo-container">
//           //   <h2 className="todo-header">To-Do List</h2>
//           //   <table className="todo-table">
//           //     <thead>
//           //       <tr>
//           //         <th>Task</th>
//           //         <th>Time</th>
//           //         <th>Action</th>
//           //       </tr>
//           //     </thead>
//           //     <tbody>
//           //       {tasks.map((task, index) => (
//           //         <tr key={index}>
//           //           <td>{task.task}</td>
//           //           <td>{task.time}</td>
//           //           <td><CheckSquare className="todo-icon" /></td>
//           //         </tr>
//           //       ))}
//           //     </tbody>
//           //   </table>
//           // </div>
          
//         )}
//       </div>

//       {isFormVisible && (
//   <div className="modal-overlay">
//     <div className="modal">
//       <h2>Schedule New Meeting</h2>
//       <form onSubmit={handleSave}>
//         <label>Meeting Title:</label>
//         <input type="text" name="title" value={formData.title} onChange={handleChange} required />

//         <label>Date & Time:</label>
//         <input type="datetime-local" name="dateTime" value={formData.dateTime} onChange={handleChange} required />

//         <label>Location:</label>
//         <input type="text" name="location" value={formData.location} onChange={handleChange} required />

//         <label>Participants:</label>
//         <input type="text" name="participants" value={formData.participants} onChange={handleChange} required />

//         <label>Description:</label>
//         <textarea name="description" value={formData.description} onChange={handleChange}></textarea>

//         <label>Reminder:</label>
//         <input type="text" name="reminder" value={formData.reminder} onChange={handleChange} />

//         <div className="modal-buttons">
//           <button type="button" className="cancel" onClick={handleCancel}>Cancel</button>
//           <button type="submit" className="save">Save</button>
//         </div>
//       </form>
//     </div>
//   </div>

//       )}
//     </div>
//     </div>
//   );
// };

// export default Meeting;



// import { useState, useEffect, useRef } from "react";
// import DailyIframe from "@daily-co/daily-js";
// import "./Meeting.css";
// import { FaCopy, FaVideo, FaSignOutAlt, FaLink } from "react-icons/fa";
// import Navbar from "./Navbar";
// import SearchBar from "./Search-bar/SearchBar";

// const Meeting = () => {
//   const callFrameRef = useRef(null);
//   const containerRef = useRef(null);
//   const [roomName, setRoomName] = useState("");
//   const [roomUrl, setRoomUrl] = useState("");
//   const [isMeetingStarted, setIsMeetingStarted] = useState(false);
//   const [joinLink, setJoinLink] = useState("");

//   const createRoom = async () => {
//     let generatedRoomName = roomName || `room-${Date.now()}`;

//     try {
//       const response = await fetch("https://api.daily.co/v1/rooms", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer 0ac72de6dfd54e6e5905a6673c8fb6c9db9c7c231be53e6734732f6295efe643`,
//         },
//         body: JSON.stringify({
//           name: generatedRoomName,
//           privacy: "public",
//           properties: {
//             enable_chat: true,
//             enable_knocking: true,
//             start_video_off: false,
//             start_audio_off: false,
//           },
//         }),
//       });

//       const data = await response.json();
//       if (data?.url) {
//         setRoomUrl(data.url);
//         setIsMeetingStarted(true);
//       } else {
//         alert(data?.error || "Failed to create room");
//       }
//     } catch (error) {
//       console.error("Error creating room:", error);
//       alert("Failed to create room");
//     }
//   };

//   const joinMeeting = () => {
//     if (joinLink) {
//       setRoomUrl(joinLink);
//       setIsMeetingStarted(true);
//     } else {
//       alert("Please enter a valid link!");
//     }
//   };

//   useEffect(() => {
//     if (isMeetingStarted && roomUrl && containerRef.current) {
//       if (!callFrameRef.current) {
//         callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
//           url: roomUrl,
//           iframeStyle: {
//             width: "100%",
//             height: "100%",
//             border: "none",
//           },
//         });

//         callFrameRef.current.join({ url: roomUrl });
//       }
//     }

//     return () => {
//       if (callFrameRef.current) {
//         callFrameRef.current.destroy();
//         callFrameRef.current = null;
//       }
//     };
//   }, [isMeetingStarted, roomUrl]);

//   const endMeeting = () => {
//     if (callFrameRef.current) {
//       callFrameRef.current.destroy();
//       callFrameRef.current = null;
//     }
//     setIsMeetingStarted(false);
//     setRoomUrl("");
//     setRoomName("");
//     setJoinLink("");
//   };

//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(roomUrl);
//     alert("Meeting link copied!");
//   };

//   return (
//     <div className="main-cont">
//      {/* <Navbar /> */}
//      <div className="container flex flex-col items-center min-h-screen" style={{width:"80%"}}>
//          <SearchBar/>
//     <div className="flex flex-col items-center p-6 min-h-screen bg-gray-100">
//       {/* Controls Section */}
//       <div className="flex gap-3 w-full max-w-2xl mb-4">
//         {/* Create Room Input + Button */}
//         <div className="flex items-center w-1/2 border border-gray-300 rounded-md overflow-hidden">
//           <FaVideo className="text-gray-500 mx-3" />
//           <input
//             type="text"
//             placeholder="Enter Room Name"
//             value={roomName}
//             onChange={(e) => setRoomName(e.target.value)}
//             className="flex-1 p-2 focus:outline-none"
//           />
//           <button
//             onClick={createRoom}
//             className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-600"
//           >
//             Start
//           </button>
//         </div>

//         {/* Join with Link Input + Button */}
//         <div className="flex items-center w-1/2 border border-gray-300 rounded-md overflow-hidden">
//           <FaLink className="text-gray-500 mx-3" />
//           <input
//             type="text"
//             placeholder={
//               isMeetingStarted ? "Enter Meeting Link" : "No meeting active"
//             }
//             value={joinLink}
//             onChange={(e) => setJoinLink(e.target.value)}
//             className="flex-1 p-2 focus:outline-none"
//           />
//           <button
//             onClick={joinMeeting}
//             className="bg-green-500 text-white px-4 py-2 hover:bg-green-600"
//           >
//             Join
//           </button>
//         </div>
//         {isMeetingStarted && roomUrl && (
//           <div className="mt-4 w-full max-w-md">
//             <div className="flex items-center justify-between bg-gray-100 border border-gray-300 p-2 rounded-md">
//               <span className="truncate text-sm">{roomUrl}</span>
//               <button onClick={copyToClipboard} className="text-blue-500">
//                 <FaCopy />
//               </button>
//             </div>
//             <button
//               onClick={endMeeting}
//               className="w-full bg-red-500 text-white mt-2 p-2 rounded-md hover:bg-red-600 flex items-center justify-center"
//             >
//               <FaSignOutAlt className="mr-2" />
//               End Meeting
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Meeting Screen */}
//       <div className="w-screen max-w-7xl h-[82vh] bg-white border border-gray-100 rounded-md flex items-center justify-center">
//         {isMeetingStarted && roomUrl ? (
//           <div ref={containerRef} className="w-full h-full" />
//         ) : (
//           <span className="text-gray-400 text-lg">No meetings are active</span>
//         )}
//       </div>

//       {/* Meeting Controls */}
//       {isMeetingStarted && roomUrl && (
//         <div className="mt-4 w-full max-w-md">
//           <div className="flex items-center justify-between bg-gray-100 border border-gray-300 p-2 rounded-md">
//             <span className="truncate text-sm">{roomUrl}</span>
//             <button onClick={copyToClipboard} className="text-blue-500">
//               <FaCopy />
//             </button>
//           </div>
//           <button
//             onClick={endMeeting}
//             className="w-full bg-red-500 text-white mt-2 p-2 rounded-md hover:bg-red-600 flex items-center justify-center"
//           >
//             <FaSignOutAlt className="mr-2" />
//             End Meeting
//           </button>
//         </div>
//       )}
//     </div>
//     </div>
//     </div>
//   );
// };

// export default Meeting;