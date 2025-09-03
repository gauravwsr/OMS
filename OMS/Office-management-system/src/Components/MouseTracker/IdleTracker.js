// import { useEffect, useState } from "react";

// const IdleTracker = () => {
//     const [warningCount, setWarningCount] = useState(0);
//     let idleTimer;

//     useEffect(() => {
//         const resetTimer = () => {
//             clearTimeout(idleTimer);
//             idleTimer = setTimeout(async () => {

//                 const newWarningCount = warningCount + 1;
//                 setWarningCount(newWarningCount);

//                 alert(`⚠ Warning ${newWarningCount}/3: You have been idle for 1 minute!`);

//                 try {
//                     await fetch("http://146.190.165.62:5001/api/idle-warning", {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ userId: localStorage.getItem("userId") }),
//                     });
//                 } catch (error) {
//                     console.error("Error sending idle warning:", error);
//                 }
//             }, 60000); // 1 minute
//         };

//         window.addEventListener("mousemove", resetTimer);
//         window.addEventListener("keydown", resetTimer);
//         resetTimer();

//         return () => {
//             clearTimeout(idleTimer);
//             window.removeEventListener("mousemove", resetTimer);
//             window.removeEventListener("keydown", resetTimer);
//         };
//     }, [warningCount]);

//     useEffect(() => {
//         if (warningCount >= 3) {
//             alert("🚨 You have been logged out due to inactivity.");
//             localStorage.removeItem("token"); // Clear authentication token
//             window.location.href = "/login"; // Redirect to login page
//         }
//     }, [warningCount]);

//     return null; // No UI component, just tracking
// };

// export default IdleTracker;

// import { useEffect, useState } from "react";

// const IdleTracker = () => {
//     const [warningCount, setWarningCount] = useState(0);
//     let idleTimer;

//     useEffect(() => {
//         const resetTimer = () => {
//             if (!localStorage.getItem("token")) return; // Stop tracking if user is logged out

//             clearTimeout(idleTimer);
//             idleTimer = setTimeout(async () => {
//                 const newWarningCount = warningCount + 1;
//                 setWarningCount(newWarningCount);

//                 alert(`⚠ Warning ${newWarningCount}/3: You have been idle for 1 minute!`);

//                 try {
//                     await fetch("http://146.190.165.62:5001/api/idle-warning", {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({ userId: localStorage.getItem("userId") }),
//                     });
//                 } catch (error) {
//                     console.error("Error sending idle warning:", error);
//                 }
//             }, 60000); // 1 minute
//         };

//         window.addEventListener("mousemove", resetTimer);
//         window.addEventListener("keydown", resetTimer);
//         resetTimer();

//         return () => {
//             clearTimeout(idleTimer);
//             window.removeEventListener("mousemove", resetTimer);
//             window.removeEventListener("keydown", resetTimer);
//         };
//     }, [warningCount]);

//     useEffect(() => {
//         if (warningCount >= 3) {
//             if (!localStorage.getItem("token")) return; // Ensure user is logged in before logout action

//             alert("🚨 You have been logged out due to inactivity.");
//             localStorage.removeItem("token"); // Clear authentication token
//             localStorage.removeItem("userId");
//             window.location.href = "/login"; // Redirect to login page
//         }
//     }, [warningCount]);

//     return null; // No UI component, just tracking
// };

// export default IdleTracker;

import { useEffect, useState, useRef } from "react";

const IdleTracker = () => {
  const [warningCount, setWarningCount] = useState(0);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    const resetTimer = () => {
      if (!localStorage.getItem("token")) return; // Stop tracking if user is logged out

      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(async () => {
        setWarningCount((prevCount) => {
          const newWarningCount = prevCount + 1;

          alert(
            `⚠ Warning ${newWarningCount}/3: You have been idle for 1 minute!`
          );

<<<<<<< HEAD
          fetch("http://146.190.165.62:5001/api/idle-warning", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: localStorage.getItem("userId") }),
          }).catch((error) =>
            console.error("Error sending idle warning:", error)
          );
=======
                    fetch("http://146.190.165.62:5001/api/idle-warning", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId: localStorage.getItem("userId") }),
                    }).catch((error) => console.error("Error sending idle warning:", error));
>>>>>>> 6b39d69f82f56048090d9f1ca6abedb01c4ded46

          return newWarningCount;
        });
      }, 60000); // 1 minute
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    resetTimer(); // Start the timer initially

    return () => {
      clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
    };
  }, []);

  useEffect(() => {
    if (warningCount >= 3) {
      if (!localStorage.getItem("token")) return; // Ensure user is logged in before logging out

      alert("🚨 You have been logged out due to inactivity.");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/login"; // Redirect to login page
    }
  }, [warningCount]);

  return null; // No UI component, just tracking
};

export default IdleTracker;
