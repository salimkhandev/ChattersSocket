const redisClient = require("../../config/redisConfig");

module.exports = (io, socket) => {

    // When caller initiates call
    socket.on('call-user', async ({ to, from, sdp }) => {
        const receiverData = await redisClient.hGet("connectedUsers", to);
        const senderData = await redisClient.hGet("connectedUsers", from);

        if (!receiverData || !senderData) {
            console.log(`User ${to} or ${from} not found or offline`);
            return;
        }

        const receiverParsed = JSON.parse(receiverData);
        const senderParsed = JSON.parse(senderData);
        const senderFullname = senderParsed.fName;
        const targetSocketId = receiverParsed.socketId;

        console.log("Call from📲📞", from, "to", senderFullname);
     

        if (targetSocketId) {
            io.to(targetSocketId).emit('incoming-call', { senderFullname, sdp, from });
        }
    });

    // When receiver answers the call
    socket.on('answer-call', async ({ to, sdp }) => {
        const callerData = await redisClient.hGet("connectedUsers", to);
        // console.log("Call answered by📲📞", to);
        // console.log("sdp", sdp) ;

        if (!callerData) {
            console.log(`Caller ${to} not found or offline`);
            return;
        }

        const callerParsed = JSON.parse(callerData);
        const callerSocketId = callerParsed.socketId;

   

        if (callerSocketId) {
            io.to(callerSocketId).emit('call-answered', { sdp });
        }
    });

    // Optionally handle ice-candidate forwarding, call rejection etc.
}
