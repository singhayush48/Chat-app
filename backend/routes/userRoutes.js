const router = require('express').Router();
const { registerUser, loginUser } = require('../controllers/authController');

router.get('/health', (req, res) => {
  res.send('User route is working fine');
});

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;