const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

// Get notifications for current user
const getNotifications = async (req, res) => {
  try {
    const { role, subRole } = req.user;
    
    // Create role array based on user's role and subRole
    const userRoles = [role];
    if (role === 'Admin' && subRole && subRole.includes('HR')) {
      userRoles.push('HR_Manager', 'HR');
    }
    
    // Find notifications targeted at user's role
    const notifications = await Notification.find({
      targetRoles: { $in: userRoles },
    })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

    // Count unread notifications for this user
    const unreadCount = await Notification.countDocuments({
      targetRoles: { $in: userRoles },
      'readBy.userId': { $ne: req.user.id }
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { title, message, type, targetRoles, eventData, priority } = req.body;
    const { id: createdBy, name: createdByName } = req.user;

    const notification = new Notification({
      title,
      message,
      type: type || 'general',
      createdBy,
      createdByName,
      targetRoles: targetRoles || ['Super_Admin', 'Admin', 'HR_Manager', 'HR'],
      eventData,
      priority: priority || 'medium',
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Error creating notification",
      error: error.message,
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Check if already read by this user
    const alreadyRead = notification.readBy.some(
      reader => reader.userId.toString() === userId
    );

    if (!alreadyRead) {
      notification.readBy.push({
        userId,
        readAt: new Date(),
      });
      await notification.save();
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

// Clear all notifications for user
const clearAllNotifications = async (req, res) => {
  try {
    const { role, subRole } = req.user;
    const userId = req.user.id;

    // Create role array based on user's role and subRole
    const userRoles = [role];
    if (role === 'Admin' && subRole && subRole.includes('HR')) {
      userRoles.push('HR_Manager', 'HR');
    }

    // Mark all notifications as read for this user
    await Notification.updateMany(
      { 
        targetRoles: { $in: userRoles },
        'readBy.userId': { $ne: userId }
      },
      { 
        $push: { 
          readBy: {
            userId,
            readAt: new Date(),
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing notifications",
      error: error.message,
    });
  }
};

// Create event notification (helper function)
const createEventNotification = async (eventData, createdBy, createdByName) => {
  try {
    console.log('🔥 createEventNotification called:', {
      eventTitle: eventData.title,
      createdBy: createdByName,
      createdById: createdBy
    });

    const notification = new Notification({
      title: "New Event Scheduled",
      message: `${createdByName} (HR Manager) has scheduled a new event: "${eventData.title}"`,
      type: 'event',
      createdBy,
      createdByName,
      targetRoles: ['Super_Admin'], // Only notify Super Admin
      eventData: {
        eventId: eventData.id,
        eventTitle: eventData.title,
        eventDate: eventData.startTime,
        location: eventData.location,
      },
      priority: 'high',
    });

    const savedNotification = await notification.save();
    console.log('🔥✅ Event notification saved to database:', {
      id: savedNotification._id,
      title: savedNotification.title,
      targetRoles: savedNotification.targetRoles
    });
    return savedNotification;
  } catch (error) {
    console.error("🔥❌ Error creating event notification:", error);
    throw error;
  }
};

// Create meeting notification (helper function)
const createMeetingNotification = async (meetingData, createdBy, createdByName) => {
  try {
    const notification = new Notification({
      title: "New Meeting Scheduled",
      message: `${createdByName} (HR Manager) has scheduled a new meeting: "${meetingData.title}"`,
      type: 'meeting',
      createdBy,
      createdByName,
      targetRoles: ['Super_Admin'], // Only notify Super Admin
      eventData: {
        eventId: meetingData.id,
        eventTitle: meetingData.title,
        eventDate: meetingData.startTime,
        location: meetingData.location,
      },
      priority: 'high',
    });

    await notification.save();
    console.log('Meeting notification created for Super Admin');
    return notification;
  } catch (error) {
    console.error("Error creating meeting notification:", error);
    throw error;
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  clearAllNotifications,
  createEventNotification,
  createMeetingNotification,
};
