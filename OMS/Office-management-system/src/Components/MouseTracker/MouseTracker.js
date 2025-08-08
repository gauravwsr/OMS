import { useEffect } from "react";

const MouseTracker = () => {
<<<<<<< HEAD
  useEffect(() => {
    const handleMouseMove = async (event) => {
      try {
        await fetch("http://localhost:5001/api/mouse-movement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x: event.clientX, y: event.clientY }),
        });
      } catch (error) {
        console.error("Error tracking mouse movement:", error);
      }
    };
=======
    useEffect(() => {
        const handleMouseMove = async (event) => {
            try {
                await fetch("http://localhost:5001/api/mouse-movement", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ x: event.clientX, y: event.clientY }),
                });
            } catch (error) {
                console.error("Error tracking mouse movement:", error);
            }
        };
>>>>>>> 6b39d69f82f56048090d9f1ca6abedb01c4ded46

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return null;
};

export default MouseTracker;
