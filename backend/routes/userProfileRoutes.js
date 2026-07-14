const router = require('express').Router();
const authmiddleware = require('../middleware/authMiddleware');
const uploadAvatar = require('../middleware/uploadMiddleware');
const { updateUserProfile, updateUserAvatar,isOnline } = require('../controllers/authController');

// PATCH /api/users/me        body: { username?, phone?, bio? }
router.patch('/me', authmiddleware, updateUserProfile);

router.get('/:id/status',authmiddleware,isOnline);

// POST /api/users/me/avatar  multipart/form-data, field name "avatar"
router.post('/me/avatar', authmiddleware, uploadAvatar.single('avatar'), updateUserAvatar);

module.exports = router;
