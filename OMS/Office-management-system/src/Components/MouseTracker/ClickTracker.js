import { useEffect } from "react";

const ClickTracker = () => {
<<<<<<< HEAD
  useEffect(() => {
    const handleClick = async (event) => {
      try {
        await fetch(localhost:5001/api/mouse-clicks", {
        await fetch("http://localhost:5001/api/mouse-clicks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x: event.clientX, y: event.clientY }),
        });
      } catch (error) {
        console.error("Error tracking mouse click:", error);
      }
    };
=======
    useEffect(() => {
        const handleClick = async (event) => {
            try {
                await fetch(localhost:5001/api/mouse-clicks", {
                await fetch("http://localhost:5001/api/mouse-clicks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ x: event.clientX, y: event.clientY }),
                });
            } catch (error) {
                console.error("Error tracking mouse click:", error);
            }
        };
>>>>>>> 6b39d69f82f56048090d9f1ca6abedb01c4ded46

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return null;
};

export default ClickTracker;
