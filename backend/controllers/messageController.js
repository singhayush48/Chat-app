const userModel=require("../models/userModel");
const messageModel=require("../models/conversationModel");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const dotenv=require("dotenv");
const cookieParser=require("cookie-parser");
const uuid=require("uuid");
dotenv.config();


const createConversation=async(req,res)=>{
  const{userId,username}=req.body;
  const senderID=req.user.userId;


  if(!userId || !username){
    return res.status(400).json({message:"All fields are required"});
  }
  const existing = await conversationModel.findPrivateConversation(
    senderId,
    receiverId
);

if (existing.rows.length > 0) {
    return res.status(200).json({
        conversationId: existing.rows[0].conversation_id,
        message: "Conversation already exists"
    });
}

    const result=await messageModel.createConversation(senderID,userId);
    return res.status(201).json({message:"Conversation created",conversationId:result});
}

const sendMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const senderId = req.user.userId;

        if (!conversationId || !content) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const member = await messageModel.isConversationMember(
            conversationId,
            senderId
        );

        if (member.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this conversation"
            });
        }

        const response = await messageModel.sendMessage(
            conversationId,
            senderId,
            content
        );

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: response.rows[0]
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

const getConversationById = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const userId = req.user.userId;

        const member = await messageModel.isConversationMember(
            conversationId,
            userId
        );

        if (member.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this conversation"
            });
        }

        const result = await messageModel.getConversationById(conversationId);

        return res.status(200).json({
            conversation: result.rows
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

module.exports={createConversation,sendMessage,getConversationById};  