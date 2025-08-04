// src/components/Message.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Message = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch data from Express
    axios.get('http://142.93.213.81:5001/api/message')
      .then(response => setMessage(response.data.message))
      .catch(error => console.error('Error:', error));
  }, []);

  return <h1>{message}</h1>;
};

export default Message;
