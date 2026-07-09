const pool=require("../db/db");

const createUser=async(userId,username,phone,email,password)=>{
    return await pool.query("INSERT INTO users(user_id,username,phone,email,password) VALUES($1,$2,$3,$4,$5) RETURNING *",[userId,username,phone,email,password]);
}
const loginUser=async(email)=>{
    return await pool.query("SELECT * FROM users WHERE email=$1",[email]);
}

const getUserById=async(userId)=>{  
    return await pool.query("SELECT * FROM users WHERE user_id=$1",[userId]);
}
 const updateUser=async(id,name,age,sex,address)=>{
    return await pool.query("UPDATE users set name=$1,age=$2,sex=$3,address=$4 where id=$5 RETURNING *",[name,age,sex,address,id]);
}

const findUserByEmail=async(email)=>{
    return await pool.query("SELECT * FROM users WHERE email=$1",[email]);
}
module.exports={createUser,loginUser,getUserById,updateUser,findUserByEmail};