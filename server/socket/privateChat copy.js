// privateChat.js
const supabase = require("../config/supabaseClient");
const redisClient = require("../config/redisConfig");

async function getAllUsers() {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
        console.error("Error fetching users:", error);
        return false;
    }

    for (const user of data) {
        if (user.username) {
            await redisClient.hSet(
                "connectedUsers",
                user.username.trim().toLowerCase(),
                JSON.stringify({ username: user.username.trim().toLowerCase(), socketId: null })
            );
            console.log(`Stored ${user.username.trim().toLowerCase()} in redis`);
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

    io.on("connection", async (socket) => {
     // ✅ sends { names: [ { name: "salim" }, { name: "khan" } ] }

        socket.on("username", async ({ username }) => {
            username = username.trim().toLowerCase();
            const allUsers = await redisClient.hGetAll("connectedUsers");

            if (username in allUsers) {
                await redisClient.hSet(
                    "connectedUsers",
                    username,
                    JSON.stringify({ username, socketId: socket.id })
                );

                allUsers[username] = JSON.stringify({ username, socketId: socket.id });

                const onlineUsers = Object.keys(allUsers).filter((user) => {
                    try {
                        const userData = JSON.parse(allUsers[user]);
                        return userData.socketId !== null;
                    } catch {
                        return false;
                    }
                });

                io.emit("online users", onlineUsers);
                socket.emit("isLoggedIn", {
                    success: true,
                    message: `User ${username} is allowed to join.`,
                });

                io.emit("private message", {
                    from: "server",
                    message: `${username} has joined the chat.`,
                });
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

            
            if (receiverData) {
                try {
                    const receiverParsed = JSON.parse(receiverData);
                    const senderParsed = JSON.parse(senderData);
                    
                    if (receiverParsed.socketId) {
                        io.to(receiverParsed.socketId).emit("chat message", {
                            from: sender,
                            message: msg.message,
                        }); 
                    }
                    
                    if (senderParsed.socketId) {
                        io.to(senderParsed.socketId).emit("chat message", {
                            from: sender,
                            message: msg.message,
                        });
                    }
                    
                    console.log(`Message sent from ${sender} to ${receiver}`);
                    // Run DB insert in the background (no await)
                    supabase.from("messages").insert({
                        sender,
                        receiver,
                        message: msg.message,
                    }).then(({ error }) => {
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

            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("❌ Error fetching chat history:", error);
                socket.emit("chat history", []);
                return;
            }

            // ✅ Emit back to the sender only
            socket.emit("chat history", data);
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
                        await redisClient.hSet(
                            "connectedUsers",
                            username,
                            JSON.stringify({ username, socketId: null })
                        );

                        const updatedUsers = await redisClient.hGetAll("connectedUsers");

                        const onlineUsers = Object.keys(updatedUsers).filter((user) => {
                            try {
                                return JSON.parse(updatedUsers[user]).socketId !== null;
                            } catch {
                                return false;
                            }
                        });

                        io.emit("online users", onlineUsers);
                        break;
                    }
                } catch { }
            }
        });
    });
}

module.exports = { startServer };
