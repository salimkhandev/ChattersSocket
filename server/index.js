const express = require("express");
const cors = require("cors");
const profileRoutes = require('./Routes/profile');
const groupProfilePics = require('./Routes/group-profile-pics');
const userLogin = require('./Routes/userLogin');
const uploadAudio = require('./Routes/uploadAudio');


const http = require("http");
const { Server } = require("socket.io");
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to ChatterSocket! we are live" });
});
app.use('/', profileRoutes);
app.use('/', uploadAudio);
app.use('/', groupProfilePics);
app.use('/', userLogin);

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});
const groupChat = require("./socket/groupChat");
const { startServer } = require("./socket/privateChat");

groupChat(io);
startServer(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} 🚀`);
});
