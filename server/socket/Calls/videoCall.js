const redisClient = require("../../config/redisConfig");
let toReceiver
let toSender
module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("A user connected:", socket.id)
   
        socket.on('sendOffer', async ({ sender, receiver, sdp, callID, isVideoCall, profilePic }) => {
        const receiverData = await redisClient.hGet("connectedUsers", receiver);
        const senderData = await redisClient.hGet("connectedUsers", sender);
          toReceiver=sender          
          toSender=receiver
        if (!receiverData || !senderData) return;

        const receiverParsed = JSON.parse(receiverData); 
        const senderParsed = JSON.parse(senderData);
        const senderFullname = senderParsed.fName;
            io.to(receiverParsed.socketId).emit('incoming-call', { sender, sdp, senderFullname, callID, isVideoCall, profilePic });
    });

    // Receiver sends answer back
        socket.on('sendAnswer', async ({ sender, receiver, sdp, profilePic, callReceiverFullname }) => {
        // sender = receiver of original offer (answer sender)
        // receiver = original caller
        const callerData = await redisClient.hGet("connectedUsers", receiver); // ✅ use receiver here
console.log({callReceiverFullname});

        if (!callerData) {
            console.log(`Caller ${receiver} not found or offline`);
            return;
        }
        
        const callerParsed = JSON.parse(callerData);
        const callerSocketId = callerParsed.socketId;

        console.log(`Answer from ${sender} sent to ${receiver}`);

        if (callerSocketId) {
            console.log('Sending answer back to caller');
            io.to(callerSocketId).emit('answer-received', { sender, sdp, profilePic, callReceiverFullname });
        }
    });
        socket.on("acceptCall", async ({ username ,profilePic}) => {
            const calleeData = await redisClient.hGet("connectedUsers", username);
            if (!calleeData) return;

            const callerData = await redisClient.hGet("connectedUsers", toReceiver);
            if (!callerData) {
                console.log(`Caller ${toReceiver} not found or offline`);
                return;
            }

            const calleeParsed = JSON.parse(calleeData);
            const callerParsed = JSON.parse(callerData);
            const callerSocketId = callerParsed.socketId;

            io.to(callerSocketId).emit("call-accepted", {
                acceptedByFullname: calleeParsed?.fName,
                acceptedByProfilePic: profilePic
            });
        });

        socket.on('rejectCall', async ({ username }) => {
            // sender = the user who rejected
            // receiver = the original caller
            const calleeData = await redisClient.hGet("connectedUsers", username);
            if (!calleeData) return;
            const callerData = await redisClient.hGet("connectedUsers", toReceiver); // ✅ use receiver here

            if (!callerData) {
                console.log(`Caller ${toReceiver} not found or offline`);
                return;
            }
            const calleeParsed = JSON.parse(calleeData);
            const callerParsed = JSON.parse(callerData);
            const callerSocketId = callerParsed.socketId;
            io.to(callerSocketId).emit('call-rejected', {
                rejectedByFullname:calleeParsed?.fName
            });
        });
        socket.on('end call', async ({ username, callID }) => {
            // sender = the user who rejected
            // receiver = the original caller
         
            const calleeData = await redisClient.hGet("connectedUsers", username);
            if (!toSender || !toReceiver) {
                console.error("No active call context");
                return;
            }
            const callerData = await redisClient.hGet("connectedUsers", toSender); // ✅ use sender here
            const callerDataD = await redisClient.hGet("connectedUsers", toReceiver); // ✅ use receiver here    

            if (!callerData) {
                console.log(`Caller ${toSender} not found or offline`);
                return;
            }
            const calleeParsed = JSON.parse(calleeData);
            const callerParsedD = JSON.parse(callerDataD);
            // socket id
            const callerSocketIdD = callerParsedD.socketId;
            
            io.to(callerSocketIdD).emit('call-rejected', {
                rejectedByFullname: 'you',
                callID: callID
            }
            );

            //  socket.broadcast.emit('call-rejected', {
            //     rejectedByFullname: 'you'
            // }
            // );


            const calleesocketID = calleeParsed.socketId;
            const callerParsed = JSON.parse(callerData);
            const callerSocketId = callerParsed.socketId;
            io.to(callerSocketId).emit('call-rejected', {
                rejectedByFullname:'you',
                callID: callID
            });
            io.to(calleesocketID).emit('call-rejected', {
                rejectedByFullname:'you',
                callID: callID
            });
        });



        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};
