const router = require('express').Router();
const { registerUser, loginUser ,getUserProfile,logoutUser,searchUser} = require('../controllers/authController');
const authmiddleware = require('../middleware/authMiddleware');

router.get('/search', authmiddleware, searchUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

module.exports = router;