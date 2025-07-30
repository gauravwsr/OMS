const express = require('express');
const router = express.Router();
const ScheduleEventData = require('../models/calenderModel');
const { createEventNotification, createMeetingNotification } = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');
const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // ya jahan se User model import hota hai


// Load all events (similar to LoadData in C#) with automatic cleanup
router.post('/GetData', async (req, res) => {
  let userId = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = decoded.id;
      console.log('User ID from token:', userId);
    } catch (error) {
      console.error('Error verifying token for GetData:', error.message);
    }
  } else {
    console.log('No authorization header for GetData request');
  }

  try {
    let events;
    if (userId) {
      events = await ScheduleEventData.find({
        $or: [
          { Users: { $size: 0 } },
          { Users: userId },
          { Users: { $elemMatch: { $eq: userId } } },
        ]
      });
      console.log(`Found ${events.length} events for user ID: ${userId}`);
    } else {
      events = await ScheduleEventData.find({
        Users: { $size: 0 }
      });
      console.log('No user ID found, returning only public events.');
    }

    res.json(events);
  } catch (err) {
    console.error('Error loading data:', err);
    res.status(500).json({ error: 'Error loading data' });
  }
});

// Cleanup finished events - Manual cleanup endpoint
router.delete('/cleanup-finished', async (req, res) => {
  try {
    const now = new Date();
    console.log('Starting cleanup of finished events...');
    
    // Delete events that ended before current time
    const result = await ScheduleEventData.deleteMany({
      EndTime: { $lt: now }
    });
    
    console.log(`Cleaned up ${result.deletedCount} finished events`);
    
    res.json({
      success: true,
      message: `Successfully cleaned up ${result.deletedCount} finished events`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error('Error during cleanup:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error during cleanup',
      details: err.message 
    });
  }
});

// Update event data (insert, update, or remove)
// router.post('/BatchData', async (req, res) => {
//   const { action, key, added, changed, deleted, value } = req.body;

//   console.log('Request Body:', req.body); 
//   try {
//     if (action === 'insert' || (action === 'batch' && added)) {
//       const newEvent = added ? added[0] : value;
//     //   console.log()
//       const newEventData = new ScheduleEventData({
//         StartTime: new Date(newEvent.StartTime),
//         EndTime: new Date(newEvent.EndTime),
//         Subject: newEvent.Subject,
//         IsAllDay: newEvent.IsAllDay,
//         StartTimezone: newEvent.StartTimezone,
//         EndTimezone: newEvent.EndTimezone,
//         RecurrenceRule: newEvent.RecurrenceRule,
//         RecurrenceID: newEvent.RecurrenceID,
//         RecurrenceException: newEvent.RecurrenceException
//       });

//       await newEventData.save();
//       const allEvents = await ScheduleEventData.find();
//       return res.json(allEvents);
//     }

//     if (action === 'update' || (action === 'batch' && changed)) {
//       const updatedEvent = changed ? changed[0] : value;
//       const event = await ScheduleEventData.findById(updatedEvent.Id);

//       if (event) {
//         event.StartTime = new Date(updatedEvent.StartTime);
//         event.EndTime = new Date(updatedEvent.EndTime);
//         event.Subject = updatedEvent.Subject;
//         event.IsAllDay = updatedEvent.IsAllDay;
//         event.StartTimezone = updatedEvent.StartTimezone;
//         event.EndTimezone = updatedEvent.EndTimezone;
//         event.RecurrenceRule = updatedEvent.RecurrenceRule;
//         event.RecurrenceID = updatedEvent.RecurrenceID;
//         event.RecurrenceException = updatedEvent.RecurrenceException;

//         await event.save();
//       }

//       const allEvents = await ScheduleEventData.find();
//       return res.json(allEvents);
//     }

//     if (action === 'remove' || (action === 'batch' && deleted)) {
//       if (action === 'remove') {
//         const event = await ScheduleEventData.findByIdAndDelete(key);
//         if (event) {
//           return res.json(await ScheduleEventData.find());
//         }
//       } else {
//         for (const eventToDelete of deleted) {
//           await ScheduleEventData.findByIdAndDelete(eventToDelete.Id);
//         }
//       }

//       return res.json(await ScheduleEventData.find());
//     }
//   } catch (err) {
//     console.error('Error updating data:', err);
//     res.status(500).json({ error: 'Error updating data' });
//   }
// });

router.post('/BatchData', async (req, res) => {
  const { action, key, added, changed, deleted, value } = req.body;

  // Try to get user from token if available
  let currentUser = null;
  const authHeader = req.headers.authorization;
  

  console.log('🔥 BatchData called:', {
    action,
    authHeader: authHeader ? 'Present' : 'Missing',
    hasAdded: !!(added && added.length > 0),
    userAgent: req.headers['user-agent']?.substring(0, 50) || 'Unknown'
  });
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      currentUser = await User.findById(decoded.id);

      console.log('🔥 User authenticated:', {
        name: currentUser?.name || 'Unknown',
        role: currentUser?.role,
        subRole: currentUser?.subRole,
        userId: currentUser?.userId
      });
    } catch (error) {
      console.log('🔥 Token verification failed:', error.message);
    }
  } else {
    console.log('🔥 No authorization header found');
  }

  try {
    if (action === 'insert' || (action === 'batch' && added && added.length > 0)) {
      const newEvent = added && added.length > 0 ? added[0] : value;
      
      // Check if newEvent is defined and contains required fields
      if (!newEvent || !newEvent.StartTime || !newEvent.EndTime || !newEvent.Subject) {
        return res.status(400).json({ error: 'Missing required fields in the event data' });
      }
      // Ensure CreateBy is a string, even if it comes as an array

      // Convert Users field: if any value is a name, convert to _id
      let users = newEvent.Users || [];
      if (!Array.isArray(users)) users = [users];
      // Find all users from DB
      const allUsers = await User.find({}, '_id name');
      const nameToId = {};
      allUsers.forEach(u => { nameToId[u.name] = u._id.toString(); });
      users = users.map(u => {
        // If it's already an ObjectId string, keep it; if it's a name, convert
        if (typeof u === 'string' && nameToId[u]) return nameToId[u];
        return u;
      });
      const createdBy = users.length > 0 ? users[0] : null;

      const newEventData = new ScheduleEventData({
        StartTime: new Date(newEvent.StartTime),
        EndTime: new Date(newEvent.EndTime),
        Subject: newEvent.Subject,
        Description: newEvent.Description,
        CreateBy: createdBy,  // Fix applied here
        Users: users,  // Always array of user IDs
        Location: newEvent.Location,
        IsAllDay: newEvent.IsAllDay || false,  
        StartTimezone: newEvent.StartTimezone || null,
        EndTimezone: newEvent.EndTimezone || null,
        RecurrenceRule: newEvent.RecurrenceRule || null,
        RecurrenceID: newEvent.RecurrenceID || null,
        RecurrenceException: newEvent.RecurrenceException || null
      });

      
      const savedEvent = await newEventData.save();

      // Create notification for the new event
      if (currentUser) {
        try {
          const eventData = {
            id: savedEvent._id,
            title: savedEvent.Subject,
            startTime: savedEvent.StartTime,
            location: savedEvent.Location || 'No location specified'
          };

          // Check if current user is HR Manager or Admin with HR role
          const isHRUser = currentUser.role === 'Admin' && 
                          (currentUser.subRole && currentUser.subRole.includes('HR'));

          // Only create notification for current/future events by HR users
          const eventStartTime = new Date(savedEvent.StartTime);
          const now = new Date();
          const isCurrentOrFutureEvent = eventStartTime >= now;


          console.log('🔥 Notification Check:', {
            user: currentUser.name,
            role: currentUser.role,
            subRole: currentUser.subRole,
            isHRUser: isHRUser,
            eventTitle: savedEvent.Subject,
            eventStartTime: eventStartTime,
            isCurrentOrFuture: isCurrentOrFutureEvent,
            willCreateNotification: isHRUser && isCurrentOrFutureEvent
          });

          // Only create notification if HR user is creating a current/future event
          if (isHRUser && isCurrentOrFutureEvent) {
            // Check if it's a meeting (based on subject or description keywords)
            const isMeeting = savedEvent.Subject.toLowerCase().includes('meeting') || 
                             savedEvent.Description?.toLowerCase().includes('meeting');


            console.log('🔥 Creating notification:', {
              type: isMeeting ? 'meeting' : 'event',
              title: savedEvent.Subject,
              createdBy: currentUser.name
            });

            if (isMeeting) {
              await createMeetingNotification(eventData, currentUser._id, currentUser.name);
            } else {
              await createEventNotification(eventData, currentUser._id, currentUser.name);
            }
            

            console.log(`🔥✅ Notification created for ${isMeeting ? 'meeting' : 'event'}: ${savedEvent.Subject} by HR user ${currentUser.name}`);
          } else if (!isHRUser) {
            console.log(`🔥❌ Event created by non-HR user ${currentUser.name} (Role: ${currentUser.role}, SubRole: ${currentUser.subRole}), no notification sent to Super Admin`);
          } else if (!isCurrentOrFutureEvent) {
            console.log(`🔥❌ Past event created by HR user ${currentUser.name}, no notification sent`);
          }
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Don't fail the event creation if notification fails
        }
      } else {
        console.log('No authenticated user, skipping notification creation');
      }

      const allEvents = await ScheduleEventData.find();
      return res.json(allEvents);

    }

    if (action === 'update' || (action === 'batch' && changed && changed.length > 0)) {
      const updatedEvent = changed && changed.length > 0 ? changed[0] : value;
      
      // Check if updatedEvent is defined and contains required fields
      if (!updatedEvent || !updatedEvent._id || !updatedEvent.StartTime || !updatedEvent.EndTime || !updatedEvent.Subject) {
        return res.status(400).json({ error: 'Missing required fields in the event data for update' });
      }


      // Ensure Users exists before using it, and convert names to IDs
      let users = updatedEvent.Users || [];
      if (!Array.isArray(users)) users = [users];
      // Find all users from DB
      const allUsers = await User.find({}, '_id name');
      const nameToId = {};
      allUsers.forEach(u => { nameToId[u.name] = u._id.toString(); });
      users = users.map(u => {
        if (typeof u === 'string' && nameToId[u]) return nameToId[u];
        return u;
      });
      const createdBy = users.length > 0 ? users[0] : null;

      const event = await ScheduleEventData.findById(updatedEvent._id);
      if (event) {
        event.StartTime = new Date(updatedEvent.StartTime);
        event.EndTime = new Date(updatedEvent.EndTime);
        event.Subject = updatedEvent.Subject;
        event.CreateBy = createdBy;  // Fix applied here
        event.Location = updatedEvent.Location;
        event.Description = updatedEvent.Description;
        event.Users = users;  // Always array of user IDs
        event.StartTimezone = updatedEvent.StartTimezone || null;
        event.EndTimezone = updatedEvent.EndTimezone || null;
        event.RecurrenceRule = updatedEvent.RecurrenceRule || null;
        event.RecurrenceID = updatedEvent.RecurrenceID || null;
        event.RecurrenceException = updatedEvent.RecurrenceException || null;

        await event.save();
      }

      const allEvents = await ScheduleEventData.find();
      return res.json(allEvents);
    }

    if (action === 'remove' || (action === 'batch' && deleted && deleted.length > 0)) {
      if (action === 'remove') {
        const event = await ScheduleEventData.findByIdAndDelete(key);
        if (event) {
          return res.json(await ScheduleEventData.find());
        }
      } else {
        for (const eventToDelete of deleted) {
          await ScheduleEventData.findByIdAndDelete(eventToDelete._id);
        }
      }

      return res.json(await ScheduleEventData.find());
    }

  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ error: 'Error updating data' });
  }
});

module.exports = router;