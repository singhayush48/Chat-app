const router = require('express').Router();
const authmiddleware = require('../middleware/authMiddleware');
const uploadAvatar = require('../middleware/uploadMiddleware');
const { updateUserProfile, updateUserAvatar, isOnline, getUserById } = require('../controllers/authController');

// PATCH /api/users/me        body: { username?, phone?, bio? }
router.patch('/me', authmiddleware, updateUserProfile);

router.get('/:id/status',authmiddleware,isOnline);

// GET /api/users/:id  -> public profile (username, bio, email, profile_pic,
// is_online, last_seen) for the profile drawer. Route order matters here:
// this must stay below '/:id/status' and '/me' so those keep matching first.
router.get('/:id', authmiddleware, getUserById);

// POST /api/users/me/avatar  multipart/form-data, field name "avatar"
router.post('/me/avatar', authmiddleware, uploadAvatar.single('avatar'), updateUserAvatar);

module.exports = router;
