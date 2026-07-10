const router = require('express').Router();
const { registerUser, loginUser ,getUserProfile,logoutUser,getAllUsers} = require('../controllers/authController');
const authmiddleware = require('../middleware/authMiddleware');
const  {createConversation,sendMessage}=require('../controllers/messageController');


router.post('/conversation', authmiddleware, createConversation);
router.get('/conversation/:id', authmiddleware,)
router.post('/message', authmiddleware, sendMessage);
module.exports = router;