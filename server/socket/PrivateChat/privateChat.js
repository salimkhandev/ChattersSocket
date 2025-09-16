// privateChat.js
const supabase = require("../../config/supabaseClient");
const redisClient = require("../../config/redisConfig");
const {sendUpdatedChatHistory }= require( './sendUpdatedChatHistory');
const sendNotification =require('../../utils/sendNotification')
const { v4: uuidv4 } = require('uuid');
const  isImageUrl  = require('../../utils/isImageUrl');
const videoCall = require("../Calls/videoCall")
const autoLogin = require("../AutoLogin/autoLogin")
const {deleteChat }= require("./deleteChat")
const { undeleteChat } = require('./undeleteChat');
const { getChatPeers }= require("./chatPeers")
const cloudinary = require("cloudinary").v2; 

async function getAllUsers() {
    const { data, error } = await supabase.from("users").select("*");
 
    
    ( async()=>  {
        const { data, error } = supabase
        .storage
        .from('profile-pics')
        .getPublicUrl('chatAppProfile.png');


        if (error) {
            console.error("Error getting public URL:", error.message);
            return null;
        }

        return data.publicUrl;
    })()

    if (error) {
        console.error("Error fetching users:", error);
        return false;

    }
    // console.log("📦 All users from Supabase:", data); // 👈 ADD THIS

    for (const user of data) {
        if (user.username) {
            await redisClient.hSet(
                "connectedUsers",
                user.username.trim().toLowerCase(),
                JSON.stringify({id:user.id, username: user.username.trim().toLowerCase(), fName: user.name.trim(), socketId: null })
            );
            // console.log(`Stored ${user.username.trim().toLowerCase()} in redis`);
        }
    }

    return true;
}

function startServer(io) {
    getAllUsers()
    
    io.on("connection", (socket) => {

        autoLogin(socket) 
        
        socket.on("edit message", async ({ messageId, newMessage ,sender , receiver}) => {
            function getPakistanISOString() {
                const now = new Date();
                const offsetMs = 5 * 60 * 60 * 1000; // +5 hours in milliseconds
                const pakistanDate = new Date(now.getTime() + offsetMs);
                return pakistanDate.toISOString().replace('Z', '+05:00');
            }
            const seenAt = getPakistanISOString();
            try {
                const { data, error } = await supabase
                    .from("messages")
                    .update({
                        message: newMessage,
                        updated: true,
                        updated_at: getPakistanISOString(),
                    })
                    .eq("id", messageId)
                    .select("*");

                if (error) {
                    console.error("Edit error:", error);
                    return;
                }

                // const updatedMessage = data[0];

                // emit to same group room
                // io.to(updatedMessage.groupName).emit("message edited", updatedMessage);
                await sendUpdatedChatHistory(io, redisClient, supabase, sender, receiver);

            } catch (err) {
                console.error("Edit exception:", err.message);
            }
        });

        socket.on("delete for me", async ({ username, messageId }) => {
            try {
                const { data: message, error: fetchError } = await supabase
                    .from("messages")
                    .select("deleted_for")
                    .eq("id", messageId)
                    .single();

                if (fetchError || !message) {
                    console.error("Message not found:", fetchError);
                    return;
                }

                let existing = message.deleted_for?.trim() || "";

                if (existing === "{}") {
                    existing = "";
                }

                const deletedForUsers = existing
                    ? existing.split(",").map((name) => name.trim()).filter(Boolean)
                    : [];

                if (!deletedForUsers.includes(username)) {
                    deletedForUsers.push(username);
                }

                const updatedDeletedFor = deletedForUsers.join(",");

                const { error: updateError } = await supabase
                    .from("messages")
                    .update({ deleted_for: updatedDeletedFor })
                    .eq("id", messageId);

                if (updateError) {
                    console.error("Failed to update deleted_for:", updateError);
                } else {
                    // socket.emit("message deleted for me", { messageId });
                }
            } catch (err) {
                console.error("Error in delete for me:", err);
            }
        });


        socket.on("deleteChat", async ({ conversationId, userId }) => {
            await deleteChat({ supabase, socket, conversationId, userId });
        });


        socket.on("delete for everyone", async ({ sender,receiver, messageId, audio_url, media_url}) => {
            try {
                // Step 1: Update DB instantly for fast feedback
                const { data: message, error } = await supabase
                    .from("messages")
                    .select("sender")
                    .eq("id", messageId)
                    .single();

                if (error || !message) {
                    console.error("Message not found:", error);
                    return;
                }

                if (message.sender !== sender) {
                    console.warn("Unauthorized delete attempt by", sender);
                    return;
                }

                const { error: updateError } = await supabase
                    .from("messages")
                    .update({ is_deleted_for_everyone: true })
                    .eq("id", messageId);

                if (updateError) {
                    console.error("Failed to update is_deleted_for_everyone:", updateError);
                    return;
                }

                // Notify frontends (optional)
                // io.emit("message deleted for everyone", { messageId });

                // Step 2: Async delete from Cloudinary if audio_url exists
                if (audio_url) {
                    const match = audio_url.match(/upload\/(?:v\d+\/)?(.+)\.webm/);
                    const publicId = match?.[1];

                    if (publicId) {
                        cloudinary.uploader.destroy(publicId, {
                            resource_type: "video",
                            invalidate: true
                        }, (error, result) => {
                            if (error) {
                                console.error("Cloudinary deletion error:", error);
                            } else {
                                console.log("Deleted from Cloudinary:", result);
                            }
                        });
                    } else {
                        console.warn("Could not extract publicId from audio_url");
                    }
                }
                if (media_url) {
                    const parts = media_url.split('/upload/');
                    if (parts.length < 2) {
                        console.warn("Invalid Cloudinary URL");
                        return;
                    }

                    let afterUpload = parts[1]; // e.g., "v123456/folder/filename.webm"
                    afterUpload = afterUpload.replace(/^v\d+\//, '');

                    const filenameWithExt = afterUpload.split('/').pop(); // "filename.webm"
                    const [publicId, ext] = filenameWithExt.split('.'); // ext = "webm", publicId = "filename"

                    // Determine resource type
                    let resourceType = "raw"; // default fallback
                    if (ext === "webm" || ext === "mp4") {
                        resourceType = "video";
                    } else if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) {
                        resourceType = "image";
                    } else if (["pdf", "doc", "docx", "txt", "csv"].includes(ext)) {
                        resourceType = "raw";
                    }

                    if (publicId) {
                        cloudinary.uploader.destroy(publicId, {
                            resource_type: resourceType,
                            invalidate: true
                        }, (error, result) => {
                            if (error) {
                                console.error("Cloudinary deletion error:", error);
                            } else {
                                console.log("Deleted from Cloudinary:", result);
                            }
                        });
                    } else {
                        console.warn("Could not extract publicId from media_url");
                    }
                }

                await sendUpdatedChatHistory(io, redisClient, supabase, sender, receiver);


            } catch (err) {
                console.error("Error in delete for everyone:", err);
            }
        });

        socket.on("username", async ({ username }) => {


            const peers = await getChatPeers({ supabase, redisClient, username,io});
            socket.emit("chatPeers", peers);



//             console.log('😡😡😡😡😡😡',peers);
// ````````````````````````````````````````````````````````````````````````````

            username = username.trim().toLowerCase();
console.log(`Username😡: ${username}`);
            // Get all users from Redis
            const allUsers = await redisClient.hGetAll("connectedUsers");
            const redisData = allUsers[username] && JSON.parse(allUsers[username]);

            // Fetch name and profile_pic from Supabase
            const { data: userRecord, error } = await supabase
                .from("users")
                .select("name, profile_pic")
                .eq("username", username)
                .single();

            if (error || !userRecord) {
                socket.emit("isLoggedIn", {
                    success: false,
                    message: `User "${username}" is not found in the DB.`,
                });
                return;
            }

            const currentFName = userRecord.name?.trim();
            const profilePic = userRecord.profile_pic || null;

            if (redisData) {
                // Existing user → update socketId and info
                redisData.socketId = socket.id;
                redisData.fName = currentFName;
                redisData.profilePic = profilePic;
                await redisClient.hSet("connectedUsers", username, JSON.stringify(redisData));
            } else {
                // New user → store in Redis
                const newUser = {
                    username,
                    fName: currentFName,
                    profilePic,
                    socketId: socket.id,
                };
                await redisClient.hSet("connectedUsers", username, JSON.stringify(newUser));
            }

            // Prepare online users list
            const updatedAllUsers = await redisClient.hGetAll("connectedUsers");
            const onlineUsers = Object.keys(updatedAllUsers)
                .map((u) => {
                    try {
                        const data = JSON.parse(updatedAllUsers[u]);
                        return data.socketId
                            ? {id:data.id,isOnline:true, username: data.username, fName: data.fName, profilePic: data.profilePic || null }
                            : null;
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);

            // Fetch unseen messages
            const { data: unseenMessages, error: unseenErr } = await supabase.rpc("get_unseen_message_counts");
            const enrichedOnlineUsers = onlineUsers.map((user) => {
                const userUnseen = unseenMessages?.filter((msg) => msg.sender === user.username) || [];
                return {
                    ...user,
                    sentUnseenMessages: userUnseen.length > 0 ? userUnseen : [{ unseen_count: 0, receiver: null }],
                };
            });

            // Emit to everyone
            // console.log('Enriched online users', JSON.stringify(enrichedOnlineUsers, null, 2));
            
            io.emit("online users", enrichedOnlineUsers);

            // Notify current socket
            socket.emit("isLoggedIn", {
                success: true,
                message: `User ${username} is allowed to join.`,
            });
        });



        socket.on("chat messages", async (msg) => {

            
            
            const sender = msg.sender.trim().toLowerCase();
            const receiver = msg.receiver.trim().toLowerCase();
            const format = msg.format;
            const media_url = msg.media_url;
            
            // const senderPeers = await getChatPeers({ supabase, redisClient, username: sender });
            // socket.emit("chatPeers", senderPeers);

                console.log({
                    msg
                });
  
            
            const receiverData = await redisClient.hGet("connectedUsers", receiver);
            const senderData = await redisClient.hGet("connectedUsers", sender);

            const created_at = new Date().toISOString(); // ✅ Add this line
            
            const { data, error } = await supabase
                .from("users")
                .select("profile_pic")
                .eq("username", sender)
                .single(); // use `.single()` if you expect exactly one result

            if (error) {
                console.error("❌ Failed to fetch profile picture:", error.message);
            } else {
                console.log("✅ Profile picture URL:", data.profile_pic);
            }
            if (receiverData) {
                try {
                    const receiverParsed = JSON.parse(receiverData);
                    
                    const senderParsed = JSON.parse(senderData);
                    const senderfullname =senderParsed.fName
                    // console.log(fName);
                    
                    
                    const messageId = uuidv4(); // ✅ generate unique ID
                    let defaultSeenState;

                    if (msg.type === "call") {
                        defaultSeenState = {
                            seen: true,
                            seen_at: created_at,
                        };
                    } else {
                        defaultSeenState = {
                            seen: false,
                            seen_at: null,
                        };
                    }
                    const messagePayload = {
                        from: sender,
                        to: receiver,
                        senderfullname:senderfullname,
                        audio_url: msg.audio_url || null,
                        format: msg.format || null,
                        media_url: msg.media_url || null,
                        is_voice: msg.is_voice || null,
                        sender_profile_pic: data.profile_pic,
                        message: msg.message,
                        created_at,
                        id: messageId,
                        deleted_for: "",
                        type: msg.type || null,
                        is_deleted_for_everyone: false,
                        ...defaultSeenState,

                    };
                    


                    if (receiverParsed.socketId) {
                        io.to(receiverParsed.socketId).emit("chat message", messagePayload);
                        // console.log('to receiver',messagePayload);
                        
                    }
                    
                    if (senderParsed.socketId) {
                        io.to(senderParsed.socketId).emit("chat message", messagePayload);
                        // console.log('to sender',messagePayload);
                    }
                    // get sender and receiver IDs from users table
                    const { data: senderUser } = await supabase
                        .from("users")
                        .select("id")
                        .eq("username", sender)
                        .single();

                    const { data: receiverUser } = await supabase
                        .from("users")
                        .select("id")
                        .eq("username", receiver)
                        .single();

                    const senderId = senderUser.id;
                    const receiverId = receiverUser.id;

                    // always keep user1_id < user2_id for uniqueness
                    const user1 = Math.min(senderId, receiverId);
                    const user2 = Math.max(senderId, receiverId);

                    // try to find an existing conversation
                    let { data: conversation } = await supabase
                        .from("conversations")
                        .select("conversation_id")
                        .eq("user1_id", user1)
                        .eq("user2_id", user2)
                        .single();

                    if (!conversation) {
                        // if not exists, create one
                        const { data: newConv, error: convError } = await supabase
                            .from("conversations")
                            .insert({ user1_id: user1, user2_id: user2 })
                            .select("conversation_id")
                            .single();

                        if (convError) {
                            console.error("❌ Error creating conversation:", convError.message);
                            return;
                        }
                        conversation = newConv;
                    }

                    const conversationId = conversation.conversation_id;

                    // Remove sender from deleted_by if they were deleted
                    await undeleteChat({ 
                        supabase, 
                        conversationId, 
                        userId: senderId 
                    });

                
                    supabase
                        .from("messages")
                        .insert({
                            id:messageId,
                            conversation_id: conversationId, 
                            sender,
                            receiver,
                            message: msg.message,
                            created_at,
                            senderfullname,
                            audio_url: msg.audio_url || null,
                            format: msg.format || null,
                            media_url: media_url || null,
                            is_voice: msg.is_voice,
                            type: msg.type || null,
                            ...defaultSeenState  
                        })
                        .then(({ error }) => {
                            if (error) {
                                console.error("❌ Failed to save message:", error);
                            } else {
                                console.log("💾 Message saved to DB");
                            }
                        });

                    let file = isImageUrl(format)
                    
                    if (msg.message && msg.type!== 'call') {
                        await sendNotification({
                            receiver,
                            title: senderfullname,
                            body: msg.message,
                            imageUrl: null,
                            badgeUrl: "https://i.ibb.co/0RS7Zm95/appIcon.png"

                        });
                    } else if (file==='image') {
                        try {
                            await sendNotification({
                                receiver,
                                title: senderfullname,
                                body: null,
                                imageUrl: media_url,
                                badgeUrl: "https://i.ibb.co/0RS7Zm95/appIcon.png"
                            });

                            
                        } catch (err) {
                            console.error("❌ Error sending image notification:", err.message);
                        }
                    }else if (file==='file') {
                        try {
                            await sendNotification({
                                receiver,
                                title: senderfullname,
                                body: 'File Received 📁',
                                imageUrl: null,
                                badgeUrl: "https://i.ibb.co/0RS7Zm95/appIcon.png"
                            });
                        } catch (err) {
                            console.error("❌ Error sending file notification:", err.message);
                        }
                        }
                    
                    else if (msg.audio_url) {
                        try {
                            await sendNotification({
                                receiver,
                                title: senderfullname,
                                body: 'Voice Message 🎤',
                                imageUrl: null,
                                badgeUrl: "https://i.ibb.co/0RS7Zm95/appIcon.png"
                            });
                        } catch (err) {
                            console.error("❌ Error sending audio notification:", err.message);
                        }
                    } 


                        
                } catch (err) {
                    console.log("Error parsing receiver/sender data");
                }


            } else {
                socket.emit("unauthorized", {
                    success: false,
                    message: `User ${receiver} is not allowed to join.`,
                });
            }

            const peers = await getChatPeers({ supabase, redisClient, username:sender });
            socket.emit("chatPeers", peers);

        });


        // ✅ Get chat history between two users
        socket.on("get chat history", async ({ sender, receiver }) => {
            sender = sender.trim().toLowerCase();
            receiver = receiver.trim().toLowerCase();
            console.log('sender ',sender,'receiver',receiver);
            

            try {
                const { data, error } = await supabase
                    .from("messages")
                    .select("*")
                    .or(`and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`)
                    .order("created_at", { ascending: true });

                if (error) throw error;
// console.log('getting chat history',data);

                socket.emit("chat history", data);
            } catch (err) {
                console.error("❌ Error fetching chat history:", err.message);
                socket.emit("chat history", []);
            }
        });



        socket.on("mark messages seen", async ({ sender, receiver }) => {
            sender = sender.trim().toLowerCase();
            receiver = receiver.trim().toLowerCase();
   
            
            try {
                
                function getPakistanISOString() {
                    const now = new Date();
                    const offsetMs = 5 * 60 * 60 * 1000; // +5 hours in milliseconds
                    const pakistanDate = new Date(now.getTime() + offsetMs);
                    return pakistanDate.toISOString().replace('Z', '+05:00');
                }
                const seenAt = getPakistanISOString();
    

                // ➜ "2025-07-16T19:57:49.028+05:00"
                // 1. Mark messages as seen and update seen_at timestamp
                await supabase
                .from("messages")
                    .update({ seen: true, seen_at: seenAt })
                    .eq("sender", sender)
                    .eq("receiver", receiver)
                    .eq("seen", false); // only unseen
                    


                await  sendUpdatedChatHistory(io, redisClient, supabase, sender, receiver);

   

                
            } catch (err) {
                // console.error("❌ Error updating seen messages:", err.message);
                // socket.emit("chat history", []); // fallback
            }
        });

        

socket.on("typing", async (status) => {
            const sender = status.sender?.trim().toLowerCase();
            const receiver = status.receiver?.trim().toLowerCase();

            if (!sender || !receiver) return;

            const receiverData = await redisClient.hGet("connectedUsers", receiver);

            if (receiverData) {
                try {
                    const userData = JSON.parse(receiverData);
                    if (userData.socketId) {
                        io.to(userData.socketId).emit("typing", {
                            message: "typing",
                            typer: sender,
                            isTyping: status.isTyping,
                        });
                    }
                } catch { }
            }
        });

        socket.on("disconnect", async () => {
            const allUsers = await redisClient.hGetAll("connectedUsers");

           
            // Find the disconnected username by socketId
            const username = Object.keys(allUsers).find((key) => {
                try {
                    const data = JSON.parse(allUsers[key]);
                    return data.socketId === socket.id;
                } catch {
                    return false;
                }
            });

            if (!username) return;
         
            

            // 🔄 Fetch Redis data for this user
            const redisData = allUsers[username] && JSON.parse(allUsers[username]);

            // 🔄 Fetch user info from Supabase
            const { data: userRecord, error } = await supabase
                .from("users")
                .select("name, profile_pic")
                .eq("username", username)
                .single();

            if (error || !userRecord) {
                console.error(`❌ Supabase user not found: ${username}`);
                return;
            }

            const currentFName = userRecord.name?.trim();
            const profilePic = userRecord.profile_pic || null;

            if (redisData) {
                const updatedUser = {
                    id: redisData.id,
                    username,
                    fName: currentFName,
                    profilePic,
                    isOnline: false,
                    socketId: null, // ❌ mark as disconnected
                };

                // ✅ Update Redis entry
                await redisClient.hSet("connectedUsers", username, JSON.stringify(updatedUser));

                // ✅ Refresh all users
                const updatedUsers = await redisClient.hGetAll("connectedUsers");

                const onlineUsers = Object.keys(updatedUsers)
                    .map((user) => {
                        try {
                            const u = JSON.parse(updatedUsers[user]);
                            return u.socketId
                                ? {
                                    id: u.id,
                                    isOnline: true,
                                    username: u.username,
                                    fName: u.fName,
                                    profilePic: u.profilePic || null,
                                }
                                : null;
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean);

                // ✅ Fetch unseen messages from Supabase
                const { data: unseenMessages, error: unseenErr } = await supabase.rpc("get_unseen_message_counts");

                if (unseenErr) {
                    console.error("Error fetching unseen message counts:", unseenErr.message);
                    io.emit("online users", onlineUsers); // fallback
                    return;
                }

                // ✅ Merge unseen counts with online users
                const enrichedOnlineUsers = onlineUsers.map((user) => {
                    const userUnseen = unseenMessages.filter((msg) => msg.sender === user.username);
                    return {
                        ...user,
                        sentUnseenMessages:
                            userUnseen.length > 0 ? userUnseen : [{ unseen_count: 0, receiver: null }],
                    };
                });

                  
                io.emit("online users", enrichedOnlineUsers);
                io.emit("disconnected-user", { disconnected_username: username });
                console.log('dicoonnecteed', username);
            }
        });


    });
}

module.exports = { startServer };
