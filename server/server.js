// server.js
const http = require("http").createServer();
const io = require("socket.io")(http, {
    cors: { origin: "*" },
});

io.on("connection", (socket) => {
    console.log("A user connected 😊");

    // let myID=socket.id;
    // console.log("User ID: ", myID);
    socket.on("chat messages", (msg) => {
    
        console.log("Message received: ", msg);
        io.emit("chat message", msg); // send,"ok"); // send to everyone
    });

    socket.on("typing", (isTyping) => {
        console.log("User is typing: ", isTyping);
        
        io.emit("typing", isTyping); // send to everyone
    });

    socket.on("disconnect", () => {
        console.log("User disconnected 😢");
    });
});

http.listen(3000, () => {
    console.log("Server listening on port 3000 🚀");
});
