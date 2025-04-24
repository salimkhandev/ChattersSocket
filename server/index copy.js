const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app); // ⬅️ Attach Express to HTTP
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for development
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to ChatterSocket! we are live" });
});

// Socket.IO logic
io.on("connection", (socket) => {
    console.log("A user connected 😊");

    socket.on("chat messages", (msg) => {
        console.log("Message received: ", msg);
        io.emit("chat message", msg); // Broadcast to all clients
    });

    socket.on("typing", (isTyping) => {
        console.log("User is typing: ", isTyping);
        io.emit("typing", isTyping); // Broadcast to all clients
    });

    socket.on("disconnect", () => {
        console.log("User disconnected 😢");
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} 🚀`);
});
