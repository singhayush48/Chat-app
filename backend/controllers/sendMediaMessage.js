const coversationModel = require('../models/conversationModel');
const { emitToConversation } = require("../sockets/socket");

function getMessageType(mimetype) {
    if (mimetype.startsWith("image/")) return "IMAGE";

    if (mimetype.startsWith("video/")) return "VIDEO";

    if (mimetype.startsWith("audio/")) return "AUDIO";

    return "DOCUMENT";
}

const sendMediaMessage = async (req, res) => {
    try {
        const { content, conversationId } = req.body;
        const senderId = req.user.userId;

        if (!conversationId) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID is required"
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No media uploaded"
            });
        }

        // With CloudinaryStorage (see middleware/chatUpload.js), req.file.path
        // is already the hosted https://res.cloudinary.com/... secure_url —
        // no local-path rewriting needed, just store it as-is.
        const mediaUrl = req.file.path;
        const mediaName = req.file.originalname;
        const mediaSize = req.file.size;
        const mediaMimeType = req.file.mimetype;
        const messageType = getMessageType(req.file.mimetype);

        const result = await coversationModel.saveMessage({
            conversationId,
            senderId,
            content: content || null,
            messageType,
            mediaUrl,
            mediaName,
            mediaSize,
            mediaMimeType,
        });

        emitToConversation(conversationId, "message:new", {
            conversationId,
            message: result
        });

        return res.status(201).json({
            success: true,
            message: result
        });
    } catch (err) {
        console.error("sendMediaMessage error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

module.exports = sendMediaMessage;
