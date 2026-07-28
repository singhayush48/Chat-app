const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,

    params: async (req, file) => {

        let folder = "vaani/documents";
        let resource_type = "raw";

        if (file.mimetype.startsWith("image/")) {
            folder = "vaani/images";
            resource_type = "image";
        }
        else if (file.mimetype.startsWith("video/")) {
            folder = "vaani/videos";
            resource_type = "video";
        }
        else if (file.mimetype.startsWith("audio/")) {
            folder = "vaani/audio";
            resource_type = "video"; // Cloudinary stores audio as video resources
        }

        // For "raw" resources (pdf/doc/zip), Cloudinary uses the public_id
        // as-is with no extension appended — unlike image/video, which get
        // a format appended automatically. Without the extension baked in,
        // the delivered URL has no file extension, which can make browsers
        // guess the wrong content type when opening/downloading it. Keeping
        // the original extension on the public_id for raw uploads avoids that.
        const ext = path.extname(file.originalname);
        const publicId = `${req.user.userId}-${Date.now()}${resource_type === "raw" ? ext : ""}`;

        return {
            folder,
            resource_type,
            public_id: publicId
        };
    }
});

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",

    "video/mp4",
    "video/webm",
    "video/quicktime",

    "application/pdf",

    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/zip",

    "audio/mpeg",
    "audio/wav",
    "audio/ogg"
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type"), false);
    }
};

const uploadMedia = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

module.exports = uploadMedia;
