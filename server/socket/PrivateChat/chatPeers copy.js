async function getChatPeers({ supabase, redisClient, username }) {
    try {
        // Step 1: Get user ID from username
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("username", username)
            .single();  

        if (userError) {
            console.error("Error fetching user data:", userError);
            io.emit("chatPeers", []);
            return;
        }

        if (!userData) {
            console.error("User not found:", username);
            io.emit("chatPeers", []);
            return;
        }

        const userId = userData.id;
        console.log("Found user ID:", userId);

        // Step 2: Get all conversations involving this user
        const { data: conversations, error: convoError } = await supabase
            .from("conversations")
            .select("conversation_id, user1_id, user2_id")
            .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (convoError) {
            console.error("Error fetching conversations:", convoError);
            io.emit("chatPeers", []);
            return;
        }

        if (!conversations || conversations.length === 0) {
            console.log("No conversations found for user:", username);
            io.emit("chatPeers", []);
            return;
        }

        console.log("Found conversations:", conversations.length);

        // Step 3: Get all peer IDs
        const peerIds = conversations.map(convo =>
            convo.user1_id === userId ? convo.user2_id : convo.user1_id
        );

        console.log("Peer IDs:", peerIds);

        // Step 4: Fetch all peer details in one query
        const { data: peersData, error: peersError } = await supabase
            .from("users")
            .select("id, username, name, profile_pic")
            .in("id", peerIds);

        if (peersError) {
            console.error("Error fetching peers data:", peersError);
            io.emit("chatPeers", []);
            return;
        }

        // Step 5: Fetch online users from Redis
        let onlineUsersMap = {};
        try {
            const connectedUsers = await redisClient.hGetAll("connectedUsers");
            console.log("Connected users from Redis:", Object.keys(connectedUsers).length);

            for (const [key, value] of Object.entries(connectedUsers)) {
                try {
                    const parsed = JSON.parse(value);
                    // Check if user has a valid socketId (online)
                    if (parsed.socketId && parsed.id) {
                        onlineUsersMap[parsed.id] = true;
                    }
                } catch (parseError) {
                    console.warn(`Failed to parse Redis user data for key ${key}:`, parseError);
                }
            }
        } catch (redisError) {
            console.error("Redis error:", redisError);
            // Continue without online status if Redis fails
        }

        // Step 6: Fetch unseen message counts
        // Step 6: Fetch unseen message counts
        let unseenMessagesData = [];
        try {
            const { data, error: unseenError } = await supabase
                .rpc("get_unseen_message_counts");

            if (unseenError) {
                console.error("Error fetching unseen messages:", unseenError);
            } else {
                unseenMessagesData = data || [];
            }
        } catch (rpcError) {
            console.error("RPC error:", rpcError);
        }

        // Step 7: Combine all data
        const peers = conversations.map(convo => {
            const peerId = convo.user1_id === userId ? convo.user2_id : convo.user1_id;
            const peer = peersData.find(p => p.id === peerId);

            if (!peer) {
                console.warn(`Peer with ID ${peerId} not found in peersData`);
                return null;
            }

            // find unseen messages where sender === peer.username AND receiver === current username
            const unseenForPeer = unseenMessagesData.find(
                msg => msg.sender === peer.username && msg.receiver === username
            );

            return {
                conversation_id: convo.conversation_id,
                id: peer.id,
                username: peer.username,
                fName: peer.name,
                profile_pic: peer.profile_pic,
                isOnline: !!onlineUsersMap[peer.id],
                unseenCount: unseenForPeer ? unseenForPeer.unseen_count : 0
            };
        }).filter(peer => peer !== null);

        console.log("Final Peers:", JSON.stringify(peers, null, 2));
        return peers;

    } catch (error) {
        console.error("Unexpected error in fetching chat peers:", error);
        console.error("Error stack:", error.stack);
        // Emit empty array in case of any unexpected error
        // socket.emit("chatPeers", []);
        return []
    }
}

module.exports = { getChatPeers };
