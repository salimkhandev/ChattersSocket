async function sendUpdatedChatHistory(io, redisClient, supabase, sender, receiver) {
    console.log('📞 Calling sendUpdatedChatHistory...');
    
    try {
        sender = sender.trim().toLowerCase();
        receiver = receiver.trim().toLowerCase();

        // 1. Fetch updated chat history between sender and receiver
        const { data: updatedChat, error } = await supabase
            .from("messages")
            .select("*")
            .or(
                `and(sender.eq.${sender},receiver.eq.${receiver}),and(sender.eq.${receiver},receiver.eq.${sender})`
            )
            .order("created_at", { ascending: true });

        if (error) throw error;

        // 2. Retrieve both users' socket info from Redis
        const [senderRaw, receiverRaw] = await Promise.all([
            redisClient.hGet("connectedUsers", sender),
            redisClient.hGet("connectedUsers", receiver)
        ]);

        const senderParsed = senderRaw ? JSON.parse(senderRaw) : null;
        const receiverParsed = receiverRaw ? JSON.parse(receiverRaw) : null;

        // 3. Emit chat to both users if connected
        if (senderParsed?.socketId) {
            io.to(senderParsed.socketId).emit("chat history", updatedChat);
            console.log("✅ Sent to sender:", sender);
        }

        if (receiverParsed?.socketId) {
            io.to(receiverParsed.socketId).emit("chat history", updatedChat);
            console.log("✅ Sent to receiver:", receiver);
        }

    } catch (err) {
        console.error("❌ Error in sendUpdatedChatHistory:", err.message);
    }
}

module.exports = { sendUpdatedChatHistory };
