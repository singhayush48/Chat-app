const { v2: cloudinary } = require("cloudinary");

const requiredEnvVars = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
    // Logged at require-time (server startup), not on the first upload
    // attempt, so a missing/misspelled key in backend/.env shows up
    // immediately instead of as a confusing runtime upload failure.
    console.warn(
        `\u26a0\ufe0f  Cloudinary is missing required env var(s): ${missing.join(", ")}. ` +
        `Media and avatar uploads will fail until these are set in backend/.env.`
    );
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



module.exports = cloudinary;