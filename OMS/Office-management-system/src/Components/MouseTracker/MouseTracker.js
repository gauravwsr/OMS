import { useEffect } from "react";

const MouseTracker = () => {
    useEffect(() => {
        const handleMouseMove = async (event) => {
            try {
                await fetch("http://138.197.27.240:5001/api/mouse-movement", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ x: event.clientX, y: event.clientY }),
                });
            } catch (error) {
                console.error("Error tracking mouse movement:", error);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return null;
};

export default MouseTracker;
