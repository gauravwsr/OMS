// src/components/Message.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Message = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from Express
    axios.get('http://138.197.27.240:5001/api/message')
      .then(response => setMessage(response.data.message))
      .catch(error => console.error('Error:', error));
  }, []);

  return <h1>{message}</h1>;
};

export default Message;
