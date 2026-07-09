const jwt=require("jsonwebtoken");
const dotenv=require("dotenv");
const cookieParser=require("cookie-parser");
const uuid=require("uuid");
dotenv.config();

const authmiddleware=(req,res,next)=>{
    const token=req.cookies.token;
    if(!token){
        return res.status(401).json({message:"Unauthorized"});
    }
    try{
        const decode=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decode;
        next();
    }catch(err){
        return res.status(401).json({message:"Unauthorized"});
    }
    next();
}

module.exports=authmiddleware;