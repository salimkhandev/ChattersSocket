const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log("A user connected 😊");

    socket.on("chat messages", (msg) => {
        console.log("Message received: ", msg);
        io.emit("chat message", msg);
    });

    socket.on("typing", (isTyping) => {
        console.log("User is typing: ", isTyping);
        io.emit("typing", isTyping);
    });

    socket.on("disconnect", () => {
        console.log("User disconnected 😢");
    });
});

module.exports = { server, io };
