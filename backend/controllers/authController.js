const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

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
            expiresIn: "1h",
        });
        res.cookie("token", token, { httpOnly: true });
        return res.status(200).json({ message: "Login successful" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("token");
        // Update the user's online status in the database. Requires
        // authmiddleware on this route so req.user is populated.
        await userModel.logoutUser(req.user.userId);
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

        const profilePicUrl = `/uploads/${req.file.filename}`;
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
    updateUserProfile,
    updateUserAvatar,
    getAllUsers,
    searchUser,
    getAllConversations,
    isOnline,
};
