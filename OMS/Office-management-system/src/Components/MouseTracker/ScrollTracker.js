import { useEffect } from "react";

const ScrollTracker = () => {
<<<<<<< HEAD
  useEffect(() => {
    const handleScroll = async () => {
      try {
        const scrollPercentage = (
          (window.scrollY /
            (document.documentElement.scrollHeight - window.innerHeight)) *
          100
        ).toFixed(2);
        await fetch("http://localhost:5001/api/scroll-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scrollPercentage }),
        });
      } catch (error) {
        console.error("Error tracking scroll:", error);
      }
    };
=======
    useEffect(() => {
        const handleScroll = async () => {
            try {
                const scrollPercentage = ((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100).toFixed(2);
                await fetch("http://localhost:5001/api/scroll-data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scrollPercentage }),
                });
            } catch (error) {
                console.error("Error tracking scroll:", error);
            }
        };
>>>>>>> 6b39d69f82f56048090d9f1ca6abedb01c4ded46

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
};

export default ScrollTracker;
