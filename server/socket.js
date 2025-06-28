const http = require("http");
const supabase = require("./config/supabaseClient");
const { Server } = require("socket.io");
const redisClient = require("./config/redisConfig");

const app = require("./app");

// let connectedUsers = {}; // { username: socket.id }

async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*');
        

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        data.forEach(async (user) => {
            if (user.username) {
                // Store as string (null as string for now, or you can use JSON.stringify if you want to store objects) store it as an object connectedUsers with hset
                await redisClient.hSet("connectedUsers", user.username.trim().toLowerCase(), JSON.stringify({ username: user.username.trim().toLowerCase(), socketId: null }));
                console.log(`Stored ${user.username.trim().toLowerCase()} in redis`);
            }
        });
        return true;
    }
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: { 
        origin: "*",
    },

});

async function startServer() {
    
    const usersFetched = await getAllUsers();
    if (usersFetched) {
        console.log("Fetched users:", usersFetched);
    }
    io.on("connection", (socket) => {
        console.log("A user connected 😊", socket.id);
        
        // for handshake.address
        
        
        socket.on("username",async ({ username }) => {
            username = username.trim().toLowerCase();

            // Get all keys (usernames)
            const allUsers = await redisClient.hGetAll("connectedUsers");
            console.log("Connected users:", allUsers);

            if (username in allUsers) {
                // Update the user's socket ID in Redis (as a string)
                await redisClient.hSet("connectedUsers", username, JSON.stringify({ username: username, socketId: socket.id }));
                
                // Update the local object to reflect the change
                allUsers[username] = JSON.stringify({ username: username, socketId: socket.id });
                
                console.log(`${username} connected with socket ID: ${socket.id}`);
                console.log("Connected users:", allUsers);
                
                // Filter to only show users with non-null socketId
                const onlineUsers = Object.keys(allUsers).filter(user => {
                    try {
                        const userData = JSON.parse(allUsers[user]);
                        return userData.socketId !== null;
                    } catch (e) {
                        return false;
                    }
                });
                
                io.emit("online users", onlineUsers); // only active
                console.log("Online users:", onlineUsers);
                io.emit("private message", {
                    from: "server",
                    message: `${username} has joined the chat.`,
                });
                
            } else {
                console.log(`User ${username} not allowed ❌`);
            }   
        });

        socket.on("chat messages", async (msg) => {
            const sender = msg.sender.trim().toLowerCase();
            const receiver = msg.receiver.trim().toLowerCase();
            

            // Get the receiver's data from Redis
            const receiverData = await redisClient.hGet("connectedUsers", receiver);
            console.log("Receiver data:", receiverData);

            if (receiverData) {
                try {
                    console.log("Receiver data:", receiverData);
                    const userData = JSON.parse(receiverData);
                    if (userData.socketId !== null) {
                        io.to(userData.socketId).emit("chat message", {
                            from: sender,
           
                            message: msg.message,
                        });
                        console.log(`Message sent from ${sender} to ${receiver}`);
                    } else {
                        console.log(`${receiver} not connected ❌`);
                    }
                } catch (e) {
                    console.log(`Error parsing user data for ${receiver}`);
                }
            } else {
                console.log(`${receiver} not found ❌`);
            }
        });


        socket.on("typing", async (status) => {
            const sender = status.sender?.trim().toLowerCase();
            const receiver = status.receiver?.trim().toLowerCase();
            const isTyping = status.isTyping;

            if (!sender || !receiver) {
                return console.log("❌ Invalid typing event payload");
            }

            const receiverData = await redisClient.hGet("connectedUsers", receiver);

            if (receiverData) {
                try {
                    const userData = JSON.parse(receiverData);
                    if (userData.socketId !== null) {
                        io.to(userData.socketId).emit("typing", {
                            message: "typing",
                            typer: sender,
                            isTyping: isTyping
                        });
                        console.log(`✏️ Typing event sent from ${sender} to ${receiver}`);
                    } else {
                        console.log(`${receiver} not connected ❌`);
                    }
                } catch (e) {
                    console.log(`❌ Error parsing user data for ${receiver}`);
                }
            } else {
                console.log(`${receiver} not found ❌`);
            }
        });

            
        
        socket.on("disconnect", async () => {
            console.log("User disconnected 😢", socket.id);

            // Get all users from Redis
            const allUsers = await redisClient.hGetAll("connectedUsers");
            
            for (let username in allUsers) {
                try {
                    const userData = JSON.parse(allUsers[username]);
                    if (userData.socketId === socket.id) {
                        // Set the socketId to null in Redis to mark as offline
                        await redisClient.hSet("connectedUsers", username, JSON.stringify({ username: username, socketId: null }));
                        console.log(`${username} removed from connected users`);
                        
                        // Get updated list and emit online users
                        const updatedUsers = await redisClient.hGetAll("connectedUsers");
                        const onlineUsers = Object.keys(updatedUsers).filter(user => {
                            try {
                                const userData = JSON.parse(updatedUsers[user]);
                                return userData.socketId !== null;
                            } catch (e) {
                                return false;
                            }
                        });
                        io.emit("online users", onlineUsers);
                        break;
                    }
                } catch (e) {
                    console.log(`Error parsing user data for ${username}`);
                }
            }
        });
    
    });
}

startServer();

module.exports = { server, io };
