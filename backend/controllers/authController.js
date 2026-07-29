const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const { disconnectUserSockets } = require("../sockets/socket");

/**
 * AUTH STRATEGY: Authorization header (Bearer token), not cookies.
 *
 * The frontend (vercel.app) and backend (onrender.com) are different
 * registrable domains — a genuinely cross-site deployment. Even with
 * `SameSite=None; Secure` set correctly, a cross-site cookie is still
 * classified as a *third-party* cookie by the browser, and both Safari
 * (ITP, on by default since 2020) and a growing share of Chrome
 * (Tracking Protection) block third-party cookies outright, regardless
 * of any cookie attribute. That's why login would succeed but the very
 * next request (/api/auth/me) would 401 on mobile even after the
 * SameSite fix — no cookie attribute can fix a third-party cookie ban.
 *
 * Sending the JWT as a normal response field and having the client
 * attach it as `Authorization: Bearer <token>` sidesteps all of this —
 * it isn't a cookie, so none of that policy machinery applies. This is
 * the standard pattern for an SPA and API that live on different
 * domains.
 */
const TOKEN_EXPIRY = "1h";

const registerUser = async (req, res) => {
    try {
        const { username, phone, email, password } = req.body;

        if (!username || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check email
        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Check phone
        const existingPhone = await userModel.findUserByPhone(phone);
        if (existingPhone.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Phone number already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await userModel.createUser(
            username,
            phone,
            email,
            hashedPassword
        );

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: result.rows[0],
        });

    } catch (err) {

        // Fallback in case PostgreSQL catches a duplicate
        if (err.code === "23505") {
            if (err.constraint === "users_email_key") {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered",
                });
            }

            if (err.constraint === "users_phone_key") {
                return res.status(409).json({
                    success: false,
                    message: "Phone number already registered",
                });
            }
        }

        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const result = await userModel.loginUser(email);

        if (!result || result.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, {
            expiresIn: TOKEN_EXPIRY,
        });
       res.cookie(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
        return res.status(200).json({ message: "Login successful" });
        // No cookie — the client stores this token and sends it back as
        // `Authorization: Bearer <token>` on every subsequent request
        // (see frontend src/utils/tokenStorage.js + src/api/axiosInstance.js)
        // and on the Socket.IO handshake (see frontend src/services/socket.js).
        return res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const logoutUser = async (req, res) => {
    try {
        // Nothing to clear server-side — auth is a client-held Bearer
        // token now, not a cookie. The frontend deletes its stored token
        // on a successful (or even failed) call to this endpoint.
        // Update the user's online status in the database. Requires
        // authmiddleware on this route so req.user is populated.
        await userModel.logoutUser(req.user.userId);

        // The httpOnly cookie is gone, but any open Socket.IO connections
        // for this user would otherwise keep running (and keep them
        // showing as "online") until they happen to disconnect on their
        // own. Force them closed now so REST logout and socket state
        // agree immediately. The socket's own "disconnect" handler will
        // notice, but is a no-op here since logoutUser() above already
        // set is_online = FALSE.
        disconnectUserSockets(req.user.userId);

        return res.status(200).json({ message: "Logout successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const isOnline = async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await userModel.getUserById(userId);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = result.rows[0];
        return res.status(200).json({ is_online: user.is_online, last_seen: user.last_seen });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await userModel.getUserById(userId);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, phone, bio } = req.body;

        const result = await userModel.updateUserProfile(userId, { username, phone, bio });

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        // Duplicate username/phone constraint, if one exists on the table.
        if (err.code === "23505") {
            return res.status(409).json({ message: "That username or phone is already taken" });
        }
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * Expects `req.file` to already be populated by the upload middleware
 * (see middleware/uploadMiddleware.js, mounted on this route).
 */
const updateUserAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // With CloudinaryStorage (see middleware/uploadMiddleware.js),
        // req.file.filename is just the Cloudinary public_id — not a URL.
        // req.file.path is the actual hosted https://res.cloudinary.com/...
        // secure_url, which is what the frontend needs as an <img src>.
        const profilePicUrl = req.file.path;
        const result = await userModel.updateUserAvatar(userId, profilePicUrl);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * Public profile lookup for the "view this user's profile" UI (chat
 * header / avatar clicks). Reuses the same SAFE_USER_COLUMNS as
 * getUserProfile, so it never leaks the password hash. Email is included
 * since the frontend spec treats it as optional-if-available rather than
 * something to hide from other users.
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userModel.getUserById(id);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllConversations = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await userModel.getAllConversations(userId);

        // Reshape the flat SQL row into the nested shape the frontend expects:
        // { conversation_id, type, created_at, updated_at, other_user, last_message }
        const conversations = result.rows.map((row) => ({
            conversation_id: row.conversation_id,
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at,

            other_user: row.other_user_id
                ? {
                      user_id: row.other_user_id,
                      username: row.other_username,
                      profile_pic: row.other_profile_pic,
                      is_online: row.other_is_online,
                      last_seen: row.other_last_seen,
                  }
                : null,

            last_message: row.last_message_created_at
                ? {
                      content: row.last_message_content,
                      sender_id: row.last_message_sender_id,
                      created_at: row.last_message_created_at,
                  }
                : null,
        }));

        return res.status(200).json({ conversations });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const searchUser = async (req, res) => {
    try {
        const { name } = req.query;

        const users = await userModel.searchUser(name);
        if (users.rows.length === 0) {
            return res.status(404).json({ message: "No users found" });
        }
        return res.status(200).json({ users: users.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.getAllUsers();
        return res.status(200).json({ users: users.rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    getUserById,
    updateUserProfile,
    updateUserAvatar,
    getAllUsers,
    searchUser,
    getAllConversations,
    isOnline,
};
