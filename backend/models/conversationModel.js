const pool=require("../db/db");

const createConversation=async(senderId,receiverId)=>{
 const id=await pool.query("INSERT INTO CONVERSATIONS (TYPE,CREATED_BY) VALUES('PRIVATE',$1) RETURNING conversation_id",[senderId]); 

 await pool.query("INSERT INTO CONVERSATION_MEMBERS (conversation_id,user_id) VALUES($1,$2),($1,$3)",[id.rows[0].conversation_id,senderId,receiverId]);
 return id.rows[0].conversation_id;
}

const sendMessage=async(conversationId,sender_id,content)=>{
    await pool.query("UPDATE CONVERSATIONS SET updated_at=CURRENT_TIMESTAMP WHERE conversation_id=$1",[conversationId]);
    return await pool.query("INSERT INTO MESSAGES (conversation_id,sender_id,content,message_type) VALUES($1,$2,$3,'TEXT') RETURNING *",[conversationId,sender_id,content]);
}

const isConversationMember = async (conversationId, userId) => {
    return await pool.query(
        `SELECT 1
         FROM conversation_members
         WHERE conversation_id = $1
         AND user_id = $2`,
        [conversationId, userId]
    );
};

const getConversationById=async(conversationId)=>{
    return await pool.query("SELECT * FROM MESSAGES WHERE conversation_id=$1 ORDER BY updated_at DESC; RETURNING *",[conversationId]);
}
module.exports={createConversation,sendMessage,getConversationById,isConversationMember};