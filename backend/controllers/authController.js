const userModel=require("../models/userModel");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const dotenv=require("dotenv");
const cookieParser=require("cookie-parser");
const uuid=require("uuid");
dotenv.config();


const registerUser=async(req,res)=>{
    const {username,phone,email,password}=req.body;
    if(!username || !phone || !email || !password){
        return res.status(400).json({message:"All fields are required"});
    }
    const existingUser = await userModel.findUserByEmail(email);

      if (existingUser.rows.length > 0) {
    return res.status(409).json({
        success: false,
        message: "Email already registered"
    });
}
    const hashedPassword=await bcrypt.hash(password,10);
    
    const userId = uuid.v4();

console.log(userId);
console.log(userId.length);
  const result=await userModel.createUser(userId, username, phone, email, hashedPassword) 
  if(result){
    return res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: result.rows[0]
});
  }
  else{
    return res.status(500).json({
      success: false,
      message: "User registration failed"
    });
  }
   
};

const loginUser=async(req,res)=>{
    const {email,password}=req.body;
    const result=await userModel.loginUser(email);
    if(!result || result.rows.length === 0){
        return res.status(400).json({message:"User not found"});
    }
    const user=result.rows[0];
    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(400).json({message:"Invalid credentials"});
    }else{
        const token=jwt.sign({userId:user.user_id},process.env.JWT_SECRET,{expiresIn:"1h"});
        res.cookie("token",token,{httpOnly:true});
        return res.status(200).json({message:"Login successful"});
    }
}

const logoutUser=async(req,res)=>{
    res.clearCookie("token");
    return res.status(200).json({message:"Logout successful"});
}
const getUserProfile=async(req,res)=>{
    const userId=req.user.userId;
    const user=await userModel.getUserById(userId);
    return res.status(200).json({user});
}

module.exports={registerUser,loginUser,logoutUser,getUserProfile};  