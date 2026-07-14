const pool = require("../db/db");

// Columns safe to return to the client — never includes `password`.
const SAFE_USER_COLUMNS = "user_id, username, email, phone, bio, profile_pic";

const createUser = async (username, phone, email, password) => {
    return await pool.query(
        `INSERT INTO users(username, phone, email, password)
         VALUES($1, $2, $3, $4)
         RETURNING ${SAFE_USER_COLUMNS}`,
        [username, phone, email, password]
    );
};

// Used internally for login only (needs the password hash to compare
// against) — never return this row directly to the client.
const loginUser = async (email) => {
    await pool.query('UPDATE users SET is_online = TRUE WHERE email  = $1', [email]);
    return await pool.query("SELECT * FROM users WHERE email=$1", [email]);
};

const logoutUser = async (userId) => {
    await pool.query('UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE user_id = $1', [userId]);
};
const getAllUsers = async () => {
    return await pool.query(`SELECT ${SAFE_USER_COLUMNS} FROM users`);
};

const getUserById = async (userId) => {
    return await pool.query(
        `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE user_id=$1`,
        [userId]
    );
};

/**
 * Partial update — only overwrites fields that were actually passed in
 * (COALESCE falls back to the existing value for anything `null`/omitted).
 */
const updateUserProfile = async (userId, { username, phone, bio }) => {
    return await pool.query(
        `UPDATE users
         SET username = COALESCE($1, username),
             phone = COALESCE($2, phone),
             bio = COALESCE($3, bio)
         WHERE user_id = $4
         RETURNING ${SAFE_USER_COLUMNS}`,
        [username ?? null, phone ?? null, bio ?? null, userId]
    );
};

const updateUserAvatar = async (userId, profilePicUrl) => {
    return await pool.query(
        `UPDATE users
         SET profile_pic = $1
         WHERE user_id = $2
         RETURNING ${SAFE_USER_COLUMNS}`,
        [profilePicUrl, userId]
    );
};

// Used internally for registration's duplicate-email check only.
const findUserByEmail = async (email) => {
    return await pool.query("SELECT * FROM users WHERE email=$1", [email]);
};

// Used internally for registration's duplicate-phone check only.
const findUserByPhone = async (phone) => {
    return await pool.query("SELECT * FROM users WHERE phone=$1", [phone]);
};

const searchUser = async (name) => {
    return await pool.query(
        `SELECT ${SAFE_USER_COLUMNS} FROM users
         WHERE username ILIKE '%' || $1 || '%'
            OR email ILIKE '%' || $1 || '%'
            OR phone LIKE '%' || $1 || '%'`,
        [name]
    );
};

/**
 * Returns each of the user's private conversations along with the OTHER
 * participant's basic info and the most recent message (if any), so the
 * frontend can render a proper conversation list without extra round
 * trips. Uses correlated scalar subqueries for the "latest message" —
 * simple and portable; fine at this scale. If this table grows large,
 * revisit with a LATERAL join + index on (conversation_id, created_at).
 */
const getAllConversations = async (userId) => {
    return await pool.query(
        `
        SELECT
            c.conversation_id,
            c.type,
            c.created_at,
            c.updated_at,

            ou.user_id AS other_user_id,
            ou.username AS other_username,
            ou.profile_pic AS other_profile_pic,
            ou.is_online AS other_is_online,
            ou.last_seen AS other_last_seen,

            (SELECT m.content
             FROM messages m
             WHERE m.conversation_id = c.conversation_id
             ORDER BY m.created_at DESC
             LIMIT 1) AS last_message_content,

            (SELECT m.sender_id
             FROM messages m
             WHERE m.conversation_id = c.conversation_id
             ORDER BY m.created_at DESC
             LIMIT 1) AS last_message_sender_id,

            (SELECT m.created_at
             FROM messages m
             WHERE m.conversation_id = c.conversation_id
             ORDER BY m.created_at DESC
             LIMIT 1) AS last_message_created_at

        FROM conversations c

        JOIN conversation_members cm
            ON cm.conversation_id = c.conversation_id
            AND cm.user_id = $1

        LEFT JOIN conversation_members ocm
            ON ocm.conversation_id = c.conversation_id
            AND ocm.user_id != $1

        LEFT JOIN users ou
            ON ou.user_id = ocm.user_id

        WHERE c.type = 'private'

        ORDER BY c.updated_at DESC
        `,
        [userId]
    );
};

module.exports = {
    createUser,
    loginUser,
    logoutUser,
    getUserById,
    updateUserProfile,
    updateUserAvatar,
    findUserByEmail,
    findUserByPhone,
    getAllUsers,
    searchUser,
    getAllConversations,
};
