// // const express = require('express');
// // const router = express.Router();
// // const { getMessages, sendMessage } = require('../controllers/messageController');
// // const Message = require('../models/Message');

// // router.get('/', getMessages);

// // router.post('/', sendMessage);

// // // ✅ Fetch All Messages (GET /api/messages)
// // router.get('/', async (req, res) => {
// //   try {
// //     const messages = await Message.find().sort({ timestamp: 1 });
// //     res.status(200).json(messages);
// //   } catch (error) {
// //     res.status(500).json({ error: 'Error fetching messages' });
// //   }
// // });

// // // ✅ Send New Message (POST /api/messages)
// // router.post('/', async (req, res) => {
// //   try {
// //     const { sender, text } = req.body;

// //     // console.log('📩 Received Data:', req.body);

// //     if (!sender || !text) {
// //       return res.status(400).json({ error: 'Sender and text are required' });
// //     }

// //     const newMessage = new Message({ sender, text });
// //     await newMessage.save();
// //     res.status(201).json(newMessage);
// //   } catch (error) {
// //     console.error('❌ Error saving message:', error);
// //     res.status(500).json({ error: 'Error saving message' });
// //   }
// // });

// // // DELETE route for deleting a message by ID
// // router.delete('/:id', async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     // Find and delete the message by ID
// //     const deletedMessage = await Message.findByIdAndDelete(id);

// //     if (!deletedMessage) {
// //       return res.status(404).json({ error: 'Message not found' });
// //     }

// //     res.status(200).json({ message: 'Message deleted successfully', deletedMessage });
// //   } catch (error) {
// //     console.error('Error deleting message:', error);
// //     res.status(500).json({ error: 'Internal Server Error' });
// //   }
// // });

// // module.exports = router;


// const express = require('express');
// const router = express.Router();
// const messageController = require('../controllers/messageController');
// const authenticate = require('../middlewares/authMiddleware');

// // Protect all routes with authentication
// router.use(authenticate);

// // Message routes
// router.post('/', messageController.sendMessage);
// router.get('/:chatId', messageController.allMessages);
// router.put('/:messageId/read', messageController.markAsRead);
// router.delete('/:messageId', messageController.deleteMessage);

// module.exports = router;

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
// const authMiddleware = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { body, param } = require('express-validator');
const upload = require('../config/multerConfig');

// router.use(authMiddleware.protect);

router.post(
  '/',
  upload.array('attachments', 5), // Max 5 attachments
  validate([
    body('content').optional().trim(),
    body('chatId').isMongoId()
  ]),
  messageController.sendMessage
);

router.get(
  '/:chatId',
  validate([param('chatId').isMongoId()]),
  messageController.allMessages
);

router.put(
  '/:messageId/read',
  validate([param('messageId').isMongoId()]),
  messageController.markAsRead
);

router.delete(
  '/:messageId',
  validate([param('messageId').isMongoId()]),
  messageController.deleteMessage
);

module.exports = router;