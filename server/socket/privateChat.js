// privateChat.js
const supabase = require("../config/supabaseClient");
const redisClient = require("../config/redisConfig");

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
console.log(data.publicUrl);

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
                JSON.stringify({ username: user.username.trim().toLowerCase(), fName: user.name.trim(), socketId: null })
            );
            // console.log(`Stored ${user.username.trim().toLowerCase()} in redis`);
        }
    }

    return true;
}

function startServer(io) {
    getAllUsers().then((fetched) => {
        if (fetched) {
            console.log("Fetched users: true");
        }
    });

    io.on("connection", (socket) => {
        // console.log("A user connected 😊", socket.id);


        socket.on("username", async ({ username }) => {
            username = username.trim().toLowerCase();
            (async () => {
                const { data, error } = await supabase.from("users").select("name,username");

                if (error) {
                    console.error("❌ Failed to fetch user names:", error.message);
                    socket.emit("all names", { names: [] });
                    return;
                }

                const names = data.map(user => ({
                    name: user.name,
                    username: user.username,
                }));

                socket.emit("all names", { names });
            })();
            const allUsers = await redisClient.hGetAll("connectedUsers");
            // filter on the based of given username ie which is from the client side
            const redisData = allUsers[username] && JSON.parse(allUsers[username]);

            // ✅ Fetch name and profile_pic from Supabase
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
                const updatedUser = {
                    username,
                    fName: currentFName,
                    profilePic,          // ✅ store profile pic
                    socketId: socket.id,
                };

                // ✅ Update Redis with latest data
                await redisClient.hSet("connectedUsers", username, JSON.stringify(updatedUser));

                // ✅ Update local cache
                allUsers[username] = JSON.stringify(updatedUser);
                
                
                // ✅ Build online users list
                // const onlineUsers = Object.keys(allUsers)
                //     .map((user) => {
                //         try {
                //             const u = JSON.parse(allUsers[user]);
                //             return u.socketId ? {
                //                 username: u.username,
                //                 fName: u.fName,
                //                 profilePic: u.profilePic || null,  // pass it to frontend
                //             } : null;
                //         } catch {
                //             return null;
                //         }
                //     })
                //     .filter(Boolean);
                //     const { data, error } = await supabase.rpc('get_unseen_message_counts');
    
                //     if (error) {
                //         console.error("Error fetching unseen message counts:", error.message);
                //     } else {
                //         socket.emit("unseen-message-counts", data);
                //         console.log('unseen message count',data);
                        
                //     }

                //     console.log('online users are ',onlineUsers);
                //     io.emit("online users", onlineUsers);


                
                const onlineUsers = Object.keys(allUsers)
                    .map((user) => {
                        try {
                            const u = JSON.parse(allUsers[user]);
                            return u.socketId ? {
                                username: u.username,
                                fName: u.fName,
                                profilePic: u.profilePic || null
                            } : null;
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean);

                const { data: unseenMessages, error } = await supabase.rpc('get_unseen_message_counts');

                if (error) {
                    console.error("Error fetching unseen message counts:", error.message);
                } else {
                    console.log('✅ unseen message count', unseenMessages);
                    socket.emit("unseen-message-counts", unseenMessages);

                    // Now merge unseenMessages into each online user
                    const enrichedOnlineUsers = onlineUsers.map(user => {
                        const sentMessages = unseenMessages.filter(
                            msg => msg.sender === user.username
                        );

                        return {
                            username: user.username,
                            fName: user.fName,
                            profilePic: user.profilePic,
                            sentUnseenMessages: sentMessages.length > 0
                                ? sentMessages
                                : [{ unseen_count: 0, receiver: null }]
                        };
                    });

                    console.log("✅ enriched online users", enrichedOnlineUsers);
                    io.emit("online users", enrichedOnlineUsers); // include unseen in online user payload
                }



                socket.emit("isLoggedIn", {
                    success: true,
                    message: `User ${username} is allowed to join.`,
                });

                // io.emit("private message", {
                //     from: "server",
                //     message: `${username} has joined the chat.`,
                // });
            } else {
                socket.emit("isLoggedIn", {
                    success: false,
                    message: `User "${username}" is not allowed to join.`,
                });
                
            }
            
                       
                    });

        socket.on("chat messages", async (msg) => {
            const sender = msg.sender.trim().toLowerCase();
            const receiver = msg.receiver.trim().toLowerCase();

            const receiverData = await redisClient.hGet("connectedUsers", receiver);
            const senderData = await redisClient.hGet("connectedUsers", sender);

            const created_at = new Date().toISOString(); // ✅ Add this line

            if (receiverData) {
                try {
                    const receiverParsed = JSON.parse(receiverData);
                    const senderParsed = JSON.parse(senderData);

                    const messagePayload = {
                        from: sender,
                        message: msg.message,
                        created_at, // ✅ Add timestamp to emit
                    };

                    if (receiverParsed.socketId) {
                        io.to(receiverParsed.socketId).emit("chat message", messagePayload);
                    }

                    if (senderParsed.socketId) {
                        io.to(senderParsed.socketId).emit("chat message", messagePayload);
                    }

                    console.log(`Message sent from ${sender} to ${receiver}`);

                    // ✅ Save to DB with timestamp
                    supabase
                        .from("messages")
                        .insert({
                            sender,
                            receiver,
                            message: msg.message,
                            created_at,
                        })
                        .then(({ error }) => {
                            if (error) {
                                console.error("❌ Failed to save message:", error);
                            } else {
                                console.log("💾 Message saved to DB");
                            }
                        });

                        
                } catch (err) {
                    console.log("Error parsing receiver/sender data");
                }


            } else {
                socket.emit("unauthorized", {
                    success: false,
                    message: `User ${receiver} is not allowed to join.`,
                });
            }
        });

        // ✅ Get chat history between two users
        socket.on("get chat history", async ({ sender, receiver }) => {
            sender = sender.trim().toLowerCase();
            receiver = receiver.trim().toLowerCase();

            try {
                const { data, error } = await supabase
                    .from("messages")
                    .select("*")
                    .or(`and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`)
                    .order("created_at", { ascending: true });

                if (error) throw error;

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
                // 1. Mark messages as seen
                await supabase
                    .from("messages")
                    .update({ seen: true })
                    .eq("sender", sender)      // messages *from* the selected user
                    .eq("receiver", receiver)  // messages *to* the current user (receiver)
                    .eq("seen", false);        // only unseen

                // 2. Fetch updated chat history (only if you want to reflect the changes immediately)
                const { data: updatedChat, error } = await supabase
                    .from("messages")
                    .select("*")
                    .or(`and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`)
                    .order("created_at", { ascending: true });

                if (error) throw error;

                // 3. Send updated chat history to the receiver
                socket.emit("chat history", updatedChat);

                // 4. (Optional) You can also notify the sender that messages were seen
                // If you're managing a map of username -> socket.id
                // io.to(senderSocketId).emit("messages seen", { by: receiver });

            } catch (err) {
                console.error("❌ Error updating seen messages:", err.message);
                socket.emit("chat history", []); // fallback
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

    for (const username in allUsers) {
        try {
            const userData = JSON.parse(allUsers[username]);

            if (userData.socketId === socket.id) {
                // Preserve fName when updating socketId to null
                const { fName } = userData;

                await redisClient.hSet(
                    "connectedUsers",
                    username,
                    JSON.stringify({ username, fName, socketId: null })
                );

                const updatedUsers = await redisClient.hGetAll("connectedUsers");

                const onlineUsers = Object.keys(updatedUsers)
                    .map((user) => {
                        try {
                            const data = JSON.parse(updatedUsers[user]);
                            if (data.socketId) {
                                return {
                                    username: data.username,
                                    fName: data.fName,
                                };
                            }
                        } catch {
                            return null;
                        }
                    })
                    .filter(Boolean); // remove nulls

                io.emit("online users", onlineUsers);
                break;
            }
        } catch {}
    }
});

    });
}

module.exports = { startServer };
