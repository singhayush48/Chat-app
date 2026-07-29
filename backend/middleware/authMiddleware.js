const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Reads the JWT from `Authorization: Bearer <token>` instead of a cookie.
 * See controllers/authController.js for why this app uses a header
 * instead of a cookie (cross-site third-party cookie blocking on
 * Safari/mobile Chrome).
 */
const authmiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports = authmiddleware;
