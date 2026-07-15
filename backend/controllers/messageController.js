const messageModel = require("../models/conversationModel");
const { emitToConversation, emitToUser } = require("../sockets/socket");

const createConversation = async (req, res) => {
    const { userId, username } = req.body;
    const senderId = req.user.userId;

    if (!userId || !username) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await messageModel.findPrivateConversation(senderId, userId);

    if (existing.rows.length > 0) {
        return res.status(200).json({
            conversationId: existing.rows[0].conversation_id,
            message: "Conversation already exists",
        });
    }

    const result = await messageModel.createConversation(senderId, userId);

    // Let the other participant know a new conversation exists, in real
    // time, in case they're online right now (e.g. so their conversation
    // list can refresh without the user having to reload the page).
    emitToUser(userId, "conversation:created", {
        conversationId: result,
        createdBy: senderId,
    });

    return res.status(201).json({ message: "Conversation created", conversationId: result });
};

const sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user.userId;

        if (!conversationId || !content) {
            return res.status(400).json({
                message: "All fields are required",
            });
        }

        const member = await messageModel.isConversationMember(conversationId, senderId);

        if (member.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this conversation",
            });
        }

        const response = await messageModel.sendMessage(conversationId, senderId, content);
        const newMessage = response.rows[0];

        // Real-time delivery: anyone with this conversation's room open
        // (see "conversation:join" in sockets/socket.js) gets the message
        // instantly, instead of waiting to poll or refresh. REST remains
        // the source of truth for persistence — this is purely the live
        // delivery layer on top of it.
        emitToConversation(conversationId, "message:new", {
            conversationId,
            message: newMessage,
        });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: newMessage,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const getConversationById = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.userId;

        const member = await messageModel.isConversationMember(conversationId, userId);

        if (member.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this conversation",
            });
        }

        const result = await messageModel.getConversationById(conversationId);

        return res.status(200).json({
            conversation: result.rows,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.userId;

        const result = await messageModel.deleteMessage(messageId, userId);

        if (result.status !== 200) {
            return res.status(result.status).json({ message: result.message });
        }

        emitToConversation(result.conversationId, "message:deleted", {
            conversationId: result.conversationId,
            messageId,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const editMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user.userId;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                message: "Content is required",
            });
        }

        const result = await messageModel.editMessage(messageId, userId, content);

        if (result.status !== 200) {
            return res.status(result.status).json({ message: result.message });
        }

        emitToConversation(result.conversationId, "message:edited", {
            conversationId: result.conversationId,
            messageId,
            content,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

module.exports = { createConversation, sendMessage, getConversationById, deleteMessage, editMessage };
