const redisClient = require("../../config/redisConfig");

module.exports = (io, socket) => {

    // Caller initiates a call
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

    // Receiver answers the call
    socket.on('answer-call', async ({ to, sdp }) => {
        try {
            console.log(`Processing answer from ${socket.id} to ${to}`);
            
            if (!to) {
                console.log('Missing callerSocketId in answer-call');
                return;
            }
            
            if (!sdp) {
                console.log('Missing sdp in answer-call');
                return;
            }
            
            const callerData = await redisClient.hGet("connectedUsers", to);
            
            if (!callerData) {  
                console.log(`Caller ${to} not found or offline`);
                return;
            }
            
            const callerParsed = JSON.parse(callerData);
            const callerSocketId = callerParsed.socketId;
            
            console.log('Forwarding answer to caller socket ID:', callerSocketId);
            console.log('SDP type:', typeof sdp, 'SDP structure:', JSON.stringify(sdp).substring(0, 100) + '...');
            
            // Ensure SDP is properly formatted before sending
            if (callerSocketId) {
                // Ensure we're sending a plain object that can be serialized properly
                let sdpToSend = sdp;
                
                // If it's a string, try to parse it as JSON
                if (typeof sdpToSend === 'string') {
                    try {
                        sdpToSend = JSON.parse(sdpToSend);
                    } catch (e) {
                        console.log('SDP is not valid JSON, sending as is');
                    }
                }
                
                io.to(callerSocketId).emit('call-answered', { sdp: sdpToSend });
                console.log('Answer sent successfully');
            } else {
                console.log('Missing callerSocketId:', { callerSocketId });
            }
        } catch (error) {
            console.error('Error in answer-call handler:', error);
        }
    });

    // Forward ICE candidates to the other peer
    socket.on('ice-candidate', async ({ to, candidate }) => {
        console.log('Received ICE candidate:', candidate);



        try {
            console.log(`Received ICE candidate from ${socket.id} to ${to}`);
            
            if (!to) {
                console.log('Missing peer username in ice-candidate');
                return;
            }
            
            if (!candidate) {
                console.log('Missing candidate in ice-candidate');
                return;
            }
            
            const peerData = await redisClient.hGet("connectedUsers", to);
            if (!peerData) {
                console.log(`Peer ${to} not found or offline`);
                return;
            }

            const peerParsed = JSON.parse(peerData);
            const peerSocketId = peerParsed.socketId;

            if (peerSocketId) {
           
           
                
                // Ensure we're sending a plain object that can be serialized properly
                let candidateToSend = candidate;
                
                // If it's a string, try to parse it as JSON
                if (typeof candidateToSend === 'string') {
                    try {
                        candidateToSend = JSON.parse(candidateToSend);
                    } catch (e) {
                        console.log('Candidate is not valid JSON, sending as is');
                    }
                }
                
                io.to(peerSocketId).emit('ice-candidate', { candidate: candidateToSend });
            } else {
                console.log('Missing peerSocketId:', { peerSocketId });
            }
        } catch (error) {
            console.error('Error in ice-candidate handler:', error);
        }
    });

    // Optional: handle call rejection
    socket.on('call-rejected', ({ to }) => {
        redisClient.hGet("connectedUsers", to).then(data => {
            if (!data) return;
            const peerSocketId = JSON.parse(data).socketId;
            if (peerSocketId) io.to(peerSocketId).emit('call-rejected');
        });
    });
};
