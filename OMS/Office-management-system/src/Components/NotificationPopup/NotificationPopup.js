import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider/AuthContext';
import './NotificationPopup.css';

const NotificationPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const { 
    notifications, 
    unreadNotifications, 
    fetchNotifications, 
    markNotificationAsRead,
    user 
  } = useAuth();

  // Fetch notifications on component mount and user login
  useEffect(() => {
    if (user && user.role === 'Super_Admin') {
      fetchNotifications();
    }
  }, [user]);

  // Set up polling separately to avoid infinite calls
  useEffect(() => {
    if (user && user.role === 'Super_Admin') {
      const interval = setInterval(() => {
        fetchNotifications();
      }, 15000); // Poll every 15 seconds for more responsive updates

      return () => clearInterval(interval);
    }
  }, [user]);

  // Show popup when new notifications arrive
  useEffect(() => {
    if (notifications && notifications.length > 0 && user?.role === 'Super_Admin') {
      const userId = user?._id || user?.id;
      
      const unreadNotifs = notifications.filter(notif => {
        const isRead = notif.readBy.some(reader => reader.userId === userId);
        return !isRead;
      });
      
      if (unreadNotifs.length > 0) {
        setNotificationQueue(unreadNotifs);
        showNextNotification(unreadNotifs);
      }
    }
  }, [notifications, user]);

  const showNextNotification = (queue) => {
    if (queue.length > 0 && !isVisible) {
      const nextNotification = queue[0];
      setCurrentNotification(nextNotification);
      setIsVisible(true);
      
      // Auto-hide after 8 seconds
      setTimeout(() => {
        handleClose();
      }, 8000);
    }
  };

  const handleClose = async () => {
    if (currentNotification) {
      await markNotificationAsRead(currentNotification._id);
    }
    
    setIsVisible(false);
    setCurrentNotification(null);
    
    // Remove current notification from queue and show next
    const remainingQueue = notificationQueue.slice(1);
    setNotificationQueue(remainingQueue);
    
    // Show next notification after a brief delay
    if (remainingQueue.length > 0) {
      setTimeout(() => {
        showNextNotification(remainingQueue);
      }, 1000);
    }
  };

  const handleMarkAsRead = async () => {
    if (currentNotification) {
      await markNotificationAsRead(currentNotification._id);
      handleClose();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event':
        return '📅';
      case 'meeting':
        return '🤝';
      default:
        return '🔔';
    }
  };

  const getNotificationStyle = (type, priority) => {
    let baseStyle = 'notification-popup';
    
    switch (priority) {
      case 'high':
        baseStyle += ' high-priority';
        break;
      case 'medium':
        baseStyle += ' medium-priority';
        break;
      case 'low':
        baseStyle += ' low-priority';
        break;
      default:
        baseStyle += ' medium-priority';
    }
    
    return baseStyle;
  };

  if (!isVisible || !currentNotification) {
    return null;
  }

  return (
    <div className={`notification-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={getNotificationStyle(currentNotification.type, currentNotification.priority)}>
        <div className="notification-header">
          <div className="notification-icon">
            {getNotificationIcon(currentNotification.type)}
          </div>
          <div className="notification-meta">
            <h4 className="notification-title">{currentNotification.title}</h4>
            <span className="notification-time">
              {formatDate(currentNotification.createdAt)}
            </span>
          </div>
          <button 
            className="notification-close"
            onClick={handleClose}
            title="Close notification"
          >
            ×
          </button>
        </div>
        
        <div className="notification-body">
          <p className="notification-message">{currentNotification.message}</p>
          
          {currentNotification.eventData && (
            <div className="event-details">
              {currentNotification.eventData.eventDate && (
                <p className="event-date">
                  📅 {formatDate(currentNotification.eventData.eventDate)}
                </p>
              )}
              {currentNotification.eventData.location && (
                <p className="event-location">
                  📍 {currentNotification.eventData.location}
                </p>
              )}
            </div>
          )}
          
          <div className="notification-creator">
            <small>Created by: {currentNotification.createdByName}</small>
          </div>
        </div>
        
        <div className="notification-actions">
          <button 
            className="btn-mark-read"
            onClick={handleMarkAsRead}
          >
            Mark as Read
          </button>
          {notificationQueue.length > 1 && (
            <span className="notification-count">
              +{notificationQueue.length - 1} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
