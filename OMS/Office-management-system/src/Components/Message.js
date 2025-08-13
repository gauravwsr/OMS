// src/components/Message.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const Message = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch data from Express
<<<<<<< HEAD
    axios
      .get(localhost:5001/api/message")
      .then((response) => setMessage(response.data.message))
      .catch((error) => console.error("Error:", error));
=======
    axios.get('http://localhost:5001/api/message')
      .then(response => setMessage(response.data.message))
      .catch(error => console.error('Error:', error));
>>>>>>> 6b39d69f82f56048090d9f1ca6abedb01c4ded46
  }, []);

  return <h1>{message}</h1>;
};

export default Message;
