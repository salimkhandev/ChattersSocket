const express = require("express");
const cors = require("cors");
const profileRoutes = require('./Routes/profile');
const groupProfilePics = require('./Routes/group-profile-pics');
const userLogin = require('./Routes/userLogin');
const uploadAudio = require('./Routes/uploadAudio');
const uploadMedia = require('./Routes/uploadMedia');
// const notificationRoutes = require('./Routes/notifications');
const admin = require('firebase-admin');


const http = require("http");
const { Server } = require("socket.io");
const app = express();
// app.use(cors());
// app.use(express.json());
app.use(cors({
    origin: ['https://firebase-fcm2.vercel.app',
        "https://chatters-socket-frontend.vercel.app",
        'http://localhost:5173'],  // Remove trailing slash
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Welcome to ChatterSocket! we are live" });
});
app.use('/', profileRoutes);
app.use('/', groupProfilePics);
app.use('/', userLogin);
app.use('/', uploadAudio);
app.use('/', uploadMedia);
// app.use('/', notificationRoutes);
// Enable CORS - Remove the trailing slash from origin

// Initialize Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.PROJECT_ID,
            clientEmail: process.env.CLIENT_EMAIL,
            privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
        })
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Firebase Admin initialization error:', error);
}

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});
const groupChat = require("./socket/groupChat");
const { startServer } = require("./socket/privateChat/privateChat");

groupChat(io);
startServer(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} 🚀`);
});
