import { useEffect } from "react";

const ClickTracker = () => {
    useEffect(() => {
        const handleClick = async (event) => {
            try {
                await fetch("http://localhost:5001/api/mouse-clicks", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ x: event.clientX, y: event.clientY }),
                });
            } catch (error) {
                console.error("Error tracking mouse click:", error);
            }
        };

        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);

    return null;
};

export default ClickTracker;
