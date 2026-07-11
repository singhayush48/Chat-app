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
    const result=await messageModel.createConversation(senderID,userId);
    return res.status(201).json({message:"Conversation created",conversationId:result});
}

const sendMessage=async(req,res)=>{
    const {conversationId,content}=req.body;
    const senderID=req.user.userId;
    messageModel.isConversationMember(conversationId,senderID).then((result)=>{
        if(result.rows.length===0){
            return res.status(403).json({message:"You are not a member of this conversation"});
        }
        if(!conversationId || !content){
            return res.status(400).json({message:"All fields are required"});
        }
        const result=await messageModel.sendMessage(conversationId,senderID,content);
        return res.status(201).json({message:"Message sent",message:result});
    });
}

const getConversationById=async(req,res)=>{
    const conversationId=req.params.id;
    const result=await messageModel.getConversationById(conversationId);
    return res.status(200).json({conversation:result});
}

module.exports={createConversation,sendMessage,getConversationById};  