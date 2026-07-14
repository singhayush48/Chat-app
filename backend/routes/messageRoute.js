const router = require('express').Router();
const authmiddleware = require('../middleware/authMiddleware');
const { createConversation, sendMessage, getConversationById,deleteMessage,editMessage } = require('../controllers/messageController');

router.post('/conversation', authmiddleware, createConversation);
router.get('/conversation/:id', authmiddleware, getConversationById);
router.post('/message', authmiddleware, sendMessage);
router.delete('/message/:id', authmiddleware, deleteMessage);
router.patch('/message/:id', authmiddleware, editMessage);
module.exports = router;
