// const express = require('express');
// const router = express.Router();
// const chatController = require('../controllers/chatController');
// const authMiddleware = require('../middlewares/authMiddleware');

// // Protect all routes with authentication
// router.use(authMiddleware.protect);

// // Chat routes
// router.post('/api/chat', chatController.accessChat);
// router.get('/api/chat', chatController.fetchChats);
// router.post('/api/chat/group', chatController.createGroupChat);
// router.put('/api/group/rename', chatController.renameGroup);
// router.put('/api/group/add', chatController.addToGroup);
// router.put('/api/group/remove', chatController.removeFromGroup);
// router.delete('/api/:chatId', chatController.deleteChat);

// module.exports = router;

const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
// const authMiddleware = require('../middlewares/authMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { body, param } = require('express-validator');

// router.use(authMiddleware.protect);
router.use(protect);

// Chat routes
router.route('/')
  .get(async (req, res) => {
    try {
      // Your chat fetching logic
      res.json({ success: true, data: [] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      // Your chat creation logic
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
// Access or create chat
router.post(
  '/',
  validate([
    body('userId').optional().isMongoId(),
    body('candidateId').optional().isMongoId()
  ]),
  chatController.accessChat
);

// Get all chats for user
router.get('/', chatController.fetchChats);

// Group chat operations
router.post(
  '/group',
  validate([
    body('chatName').trim().notEmpty(),
    body('users').optional().isArray(),
    body('candidates').optional().isArray()
  ]),
  chatController.createGroupChat
);

router.put(
  '/group/rename',
  validate([
    body('chatId').isMongoId(),
    body('chatName').trim().notEmpty()
  ]),
  chatController.renameGroup
);

router.put(
  '/group/add',
  validate([
    body('chatId').isMongoId(),
    body('userId').optional().isMongoId(),
    body('candidateId').optional().isMongoId()
  ]),
  chatController.addToGroup
);

router.put(
  '/group/remove',
  validate([
    body('chatId').isMongoId(),
    body('userId').optional().isMongoId(),
    body('candidateId').optional().isMongoId()
  ]),
  chatController.removeFromGroup
);

router.delete(
  '/:chatId',
  validate([param('chatId').isMongoId()]),
  chatController.deleteChat
);

module.exports = router;