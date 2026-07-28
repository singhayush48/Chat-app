const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "vaani/profile_pictures",
        public_id: `${req.user.userId}-${Date.now()}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"]
    })
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ];

    if (!allowed.includes(file.mimetype)) {
        return cb(new Error("Only image uploads are allowed"));
    }

    cb(null, true);
};

const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadAvatar;