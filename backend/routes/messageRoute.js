const router = require('express').Router();
const authmiddleware = require('../middleware/authMiddleware');
const upladMedia = require('../middleware/chatUpload');
const handleUpload = require('../middleware/handleUpload');
const sendMediaMessage = require('../controllers/sendMediaMessage');
const { createConversation, sendMessage, getConversationById,deleteMessage,editMessage } = require('../controllers/messageController');

router.post('/conversation', authmiddleware, createConversation);
router.get('/conversation/:id', authmiddleware, getConversationById);
router.post('/message', authmiddleware, sendMessage);
router.delete('/message/:id', authmiddleware, deleteMessage);
router.patch('/message/:id', authmiddleware, editMessage);
router.post('/message/media', authmiddleware, handleUpload(upladMedia.single('media')), sendMediaMessage);

module.exports = router;
