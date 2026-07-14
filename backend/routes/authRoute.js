const router = require('express').Router();
const { getUserProfile, getAllUsers, getAllConversations } = require('../controllers/authController');
const authmiddleware = require('../middleware/authMiddleware');

router.get('/health', (req, res) => {
  res.send('User route is working fine');
});

router.get('/me', authmiddleware, getUserProfile);
router.get('/conversations', authmiddleware, getAllConversations);
router.get('/users', authmiddleware, getAllUsers);

module.exports = router;
