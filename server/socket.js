const http = require("http");
const supabase = require("./config/supabaseClient");
const { Server } = require("socket.io");
const app = require("./app");

let connectedUsers = {}; // { username: socket.id }

async function getAllUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
    } else {
        data.forEach(user => {
            if (user.username) {
                connectedUsers[user.username.trim().toLowerCase()] = null;
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
        console.log("Fetched users:", connectedUsers);
    }

    io.on("connection", (socket) => {
        console.log("A user connected 😊", socket.id);

        socket.on("username", ({ username }) => {
            username = username.trim().toLowerCase();

            if (username in connectedUsers) {
                connectedUsers[username] = socket.id;
                console.log(`${username} connected with socket ID: ${socket.id}`);
                console.log("Connected users:", connectedUsers);
                io.emit("online users", Object.keys(connectedUsers).filter(user => connectedUsers[user])); // only active
                console.log("Online users:", Object.keys(connectedUsers).filter(user => connectedUsers[user]));
                

                io.emit("private message", {
                    from: "server",
                    message: `${username} has joined the chat.`,
                });

            } else {
                console.log(`User ${username} not allowed ❌`);
            }
        });
        

        socket.on("chat messages", (msg) => {
            const sender = msg.sender.trim().toLowerCase();
            const receiver = msg.receiver.trim().toLowerCase();
            const receiverSocket = connectedUsers[receiver];

            if (receiverSocket) {
                io.to(receiverSocket).emit("chat message", {
                    from: sender,
                    message: msg.message,
                });
                console.log(`Message sent from ${sender} to ${receiver}`);
            } else {
                console.log(`${receiver} not connected ❌`);
            }
        });


        socket.on("typing", (isTyping) => {
            io.emit("typing", isTyping);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected 😢", socket.id);

            for (let username in connectedUsers) {
                if (connectedUsers[username] === socket.id) {
                    delete connectedUsers[username];
                    console.log(`${username} removed from connected users`);

                    io.emit("online users", Object.keys(connectedUsers).filter(user => connectedUsers[user]));
                    break;
                }
            }
        });
    });
}

startServer();

module.exports = { server, io };
