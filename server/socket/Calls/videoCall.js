const redisClient = require("../../config/redisConfig");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id)
   
    socket.on('sendOffer', async ({ sender, receiver, sdp }) => {
        const receiverData = await redisClient.hGet("connectedUsers", receiver);
        const senderData = await redisClient.hGet("connectedUsers", sender);

        if (!receiverData || !senderData) return;

        const receiverParsed = JSON.parse(receiverData);
        io.to(receiverParsed.socketId).emit('incoming-call', { sender, sdp });
    });

    // Receiver sends answer back
    socket.on('sendAnswer', async ({ sender, receiver, sdp }) => {
        // sender = receiver of original offer (answer sender)
        // receiver = original caller
        const callerData = await redisClient.hGet("connectedUsers", receiver); // ✅ use receiver here

        if (!callerData) {
            console.log(`Caller ${receiver} not found or offline`);
            return;
        }

        const callerParsed = JSON.parse(callerData);
        const callerSocketId = callerParsed.socketId;

        console.log(`Answer from ${sender} sent to ${receiver}`);

        if (callerSocketId) {
            console.log('Sending answer back to caller');
            io.to(callerSocketId).emit('answer-received', { sender, sdp });
        }
    });
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
