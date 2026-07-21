const pool = require("../db/db");

const createConversation = async (senderId, receiverId) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Check if conversation already exists
        const existingConversation = await client.query(
            `
            SELECT cm.conversation_id
            FROM conversation_members cm
            JOIN conversations c
            ON c.conversation_id = cm.conversation_id
            WHERE c.type = 'private'
            AND cm.user_id IN ($1, $2)
            GROUP BY cm.conversation_id
            HAVING COUNT(DISTINCT cm.user_id) = 2
            `,
            [senderId, receiverId]
        );

        if (existingConversation.rows.length > 0) {
            await client.query("COMMIT");
            return existingConversation.rows[0].conversation_id;
        }

        // Create conversation
        const conversation = await client.query(
            `
            INSERT INTO conversations(type, created_by)
            VALUES('private', $1)
            RETURNING conversation_id
            `,
            [senderId]
        );

        const conversationId = conversation.rows[0].conversation_id;

        // Insert sender
        await client.query(
            `
            INSERT INTO conversation_members(conversation_id, user_id)
            VALUES($1, $2)
            `,
            [conversationId, senderId]
        );

        // Insert receiver
        await client.query(
            `
            INSERT INTO conversation_members(conversation_id, user_id)
            VALUES($1, $2)
            `,
            [conversationId, receiverId]
        );

        await client.query("COMMIT");

        return conversationId;

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }
};

const sendMessage = async (conversationId, senderId, content) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const message = await client.query(
            `
            INSERT INTO messages
            (conversation_id, sender_id, content, message_type)
            VALUES($1, $2, $3, 'text')
            RETURNING *
            `,
            [conversationId, senderId, content]
        );

        await client.query(
            `
            UPDATE conversations
            SET updated_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1
            `,
            [conversationId]
        );

        await client.query("COMMIT");

        return message;

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }
};

const isConversationMember = async (conversationId, userId) => {

    return await pool.query(
        `
        SELECT 1
        FROM conversation_members
        WHERE conversation_id = $1
        AND user_id = $2
        `,
        [conversationId, userId]
    );
};

const findPrivateConversation = async (senderId, receiverId) => {

    return await pool.query(
        `
        SELECT cm.conversation_id
        FROM conversation_members cm
        JOIN conversations c
        ON c.conversation_id = cm.conversation_id
        WHERE c.type = 'private'
        AND cm.user_id IN ($1, $2)
        GROUP BY cm.conversation_id
        HAVING COUNT(DISTINCT cm.user_id) = 2
        `,
        [senderId, receiverId]
    );
};

const getConversationById = async (conversationId) => {

    return await pool.query(
        `
        SELECT *
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at ASC
        `,
        [conversationId]
    );
};

const deleteMessage = async (messageId, userId) => {

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const message = await client.query(
            `
            SELECT *
            FROM messages
            WHERE message_id = $1
            `,
            [messageId]
        );

        if (message.rows.length === 0) {
            await client.query("ROLLBACK");
            return { status: 404, message: "Message not found" };
        }

        if (message.rows[0].sender_id !== userId) {
            await client.query("ROLLBACK");
            return { status: 403, message: "You are not the sender of this message" };
        }

        await client.query(
            `
            UPDATE messages
            SET is_deleted = TRUE,
                deleted_at = CURRENT_TIMESTAMP
            WHERE message_id = $1
            `,
            [messageId]
        );

        await client.query("COMMIT");
        // conversationId is handed back so the controller can tell the
        // socket layer which conversation room to broadcast the deletion to.
        return {
            status: 200,
            message: "Message deleted successfully",
            conversationId: message.rows[0].conversation_id,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

const editMessage = async (messageId, userId, newContent) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const message = await client.query(
            `
            SELECT *
            FROM messages
            WHERE message_id = $1
            `,
            [messageId]
        );

        if (message.rows.length === 0) {
            await client.query("ROLLBACK");
            return { status: 404, message: "Message not found" };
        }

        if (message.rows[0].sender_id !== userId) {
            await client.query("ROLLBACK");
            return { status: 403, message: "You are not the sender of this message" };
        }

        await client.query(
            `
            UPDATE messages
            SET content = $1,
                edited_at = CURRENT_TIMESTAMP
            WHERE message_id = $2
            `,
            [newContent, messageId]
        );

        await client.query("COMMIT");
        // conversationId is handed back so the controller can tell the
        // socket layer which conversation room to broadcast the edit to.
        return {
            status: 200,
            message: "Message edited successfully",
            conversationId: message.rows[0].conversation_id,
        };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

const updateMessageStatus = async (messageId, status) => {
    return await pool.query(
        `
        UPDATE messages
        SET status = $1
        WHERE message_id = $2
        `,
        [status, messageId]
    );
};

/** Used by the "message:delivered" socket handler to know who to notify. */
const getMessageSenderId = async (messageId) => {
    return await pool.query(
        `
        SELECT sender_id
        FROM messages
        WHERE message_id = $1
        `,
        [messageId]
    );
};

const markMessagesAsSeen=async (conversationId, userId) => {
    // RETURNING sender_id so the "message:seen" socket handler knows
    // exactly which sender(s) to notify — without this, the caller has no
    // way to find out who sent the messages that just got marked seen.
    return await pool.query(
        `
        UPDATE messages
        SET status = 'SEEN'
        WHERE conversation_id = $1
        AND sender_id != $2
        AND status != 'SEEN'
        RETURNING message_id, sender_id
        `,
        [conversationId, userId]
    );
};
/**
 * 
 * 
 * Returns the distinct set of "other user" ids that `userId` shares a
 * private conversation with. Used purely for scoping real-time presence
 * broadcasts (user:online / user:offline) — so a user's online status is
 * only pushed to people who actually have a conversation with them,
 * instead of io.emit()-ing it to every connected client.
 */
const getContactIds = async (userId) => {
    return await pool.query(
        `
        SELECT DISTINCT ocm.user_id AS contact_id
        FROM conversation_members cm
        JOIN conversation_members ocm
            ON ocm.conversation_id = cm.conversation_id
            AND ocm.user_id != cm.user_id
        JOIN conversations c
            ON c.conversation_id = cm.conversation_id
            AND c.type = 'private'
        WHERE cm.user_id = $1
        `,
        [userId]
    ).then((result) => result.rows);
};

/**
 * All conversation ids a user belongs to. Used to auto-join their socket
 * to every one of their conversation rooms on connect (see
 * sockets/socket.js), so message:new / status updates reach them even
 * for conversations they haven't explicitly opened yet — otherwise
 * delivery receipts and sidebar previews would only work for whichever
 * single chat happens to be open.
 */
const getUserConversationIds = async (userId) => {
    return await pool.query(
        `
        SELECT conversation_id
        FROM conversation_members
        WHERE user_id = $1
        `,
        [userId]
    ).then((result) => result.rows);
};

module.exports = {
    createConversation,
    sendMessage,
    getConversationById,
    isConversationMember,
    findPrivateConversation,
    deleteMessage,
    editMessage,
    getContactIds,
    getUserConversationIds,
    updateMessageStatus,
    getMessageSenderId,
    markMessagesAsSeen,
};
