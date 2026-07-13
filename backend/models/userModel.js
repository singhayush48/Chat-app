const pool=require("../db/db");

const createUser=async(username,phone,email,password)=>{
    return await pool.query("INSERT INTO users(username,phone,email,password) VALUES($1,$2,$3,$4) RETURNING *",[username,phone,email,password]);
}
const loginUser=async(email)=>{
    return await pool.query("SELECT * FROM users WHERE email=$1",[email]);
}

const getAllUsers=async()=>{
    return await pool.query("SELECT * FROM users");
}

const getUserById=async(userId)=>{  
    return await pool.query("SELECT * FROM users WHERE user_id=$1",[userId]);
}
 const updateUser=async(id,name,age,sex,address)=>{
    return await pool.query("UPDATE users set name=$1,age=$2,sex=$3,address=$4 where id=$5 RETURNING *",[name,age,sex,address,id]);
}
  const searchUser=async(name)=>{
    return await pool.query("SELECT user_id, username, email, phone, bio, profile_pic FROM users WHERE username ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%' OR phone LIKE '%' || $1 || '%'",[name]);
  }
const findUserByEmail=async(email)=>{
    return await pool.query("SELECT * FROM users WHERE email=$1",[email]);
}

const getAllConversations=async(userId)=>{
    return await pool.query("SELECT c.* FROM conversations c JOIN conversation_members cm ON c.conversation_id = cm.conversation_id WHERE cm.user_id = $1;",[userId]);
}
module.exports={createUser,loginUser,getUserById,updateUser,findUserByEmail,getAllUsers,searchUser,getAllConversations};