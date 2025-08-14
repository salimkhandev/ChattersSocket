const redisClient = require("../../config/redisConfig");

module.exports = (io, socket) => {

    // Caller initiates a call
    socket.on('sendOffer', async ({ sender, receiver, sdp }) => {

        // log the sdp
        console.log("SDP Offer from", sender, "to", receiver, sdp);
        const receiverData = await redisClient.hGet("connectedUsers", receiver);
        const senderData = await redisClient.hGet("connectedUsers", sender);

        if (!receiverData || !senderData) {
            console.log(`User ${receiver} or ${sender} not found or offline`);
            return;
        }

        const receiverParsed = JSON.parse(receiverData);
        const senderParsed = JSON.parse(senderData);
        const senderFullname = senderParsed.fName;
        const receiverSocketId = receiverParsed.socketId;

        console.log("Call from📲📞", sender, "to", receiver);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incoming-call', { senderFullname, sdp, sender });
        }
   
    });
    // Receiver sends answer back
    socket.on('sendAnswer', async ({ sender, receiver, sdp }) => {
        // sender = receiver of original offer
        // receiver = original sender (caller)
        const callerData = await redisClient.hGet("connectedUsers", sender);

        if (!callerData) {
            console.log(`Caller ${receiver} not found or offline`);
            return;
        }

        const callerParsed = JSON.parse(callerData);
        const callerSocketId = callerParsed.socketId;

        console.log(`Answer from ${sender} sent to ${receiver}`);

        if (callerSocketId) {
            io.to(callerSocketId).emit('answer-received', { sender, sdp });
        }
    });
};

