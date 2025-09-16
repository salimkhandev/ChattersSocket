async function getChatPeers({ supabase, redisClient, username, io }) {
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
            .select("conversation_id, user1_id, user2_id, deleted_by")
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

        // Step 2.5: Filter out conversations where current user has deleted
        const activeConversations = conversations.filter(convo => {
            const deletedBy = convo.deleted_by || [];
            return !deletedBy.includes(userId);
        });

        if (activeConversations.length === 0) {
            console.log("No active conversations found for user:", username);
            io.emit("chatPeers", []);
            return;
        }

        console.log("Found active conversations:", activeConversations.length);

        // Step 3: Get latest messages for all active conversations in one query
        const conversationIds = activeConversations.map(c => c.conversation_id);

        const { data: allMessages, error: messagesError } = await supabase
            .from("messages")
            .select("conversation_id, created_at")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false });

        if (messagesError) {
            console.error("Error fetching messages:", messagesError);
        }

        // Step 4: Create a map of conversation_id to latest message timestamp
        const latestMessageMap = {};
        if (allMessages) {
            allMessages.forEach(msg => {
                // Only keep the first (latest) message for each conversation
                if (!latestMessageMap[msg.conversation_id]) {
                    latestMessageMap[msg.conversation_id] = msg.created_at;
                }
            });
        }

        // Step 5: Sort active conversations by latest message timestamp (most recent first)
        const sortedConversations = activeConversations.sort((a, b) => {
            const timeA = latestMessageMap[a.conversation_id];
            const timeB = latestMessageMap[b.conversation_id];

            // Handle null/undefined timestamps (conversations with no messages go to the end)
            if (!timeA && !timeB) return 0;
            if (!timeA) return 1;
            if (!timeB) return -1;

            return new Date(timeB) - new Date(timeA);
        });

        // Step 6: Get all peer IDs (maintaining sorted order)
        const peerIds = sortedConversations.map(convo =>
            convo.user1_id === userId ? convo.user2_id : convo.user1_id
        );

        console.log("Peer IDs (ordered by recent messages):", peerIds);

        // Step 7: Fetch all peer details in one query
        const { data: peersData, error: peersError } = await supabase
            .from("users")
            .select("id, username, name, profile_pic")
            .in("id", peerIds);

        if (peersError) {
            console.error("Error fetching peers data:", peersError);
            io.emit("chatPeers", []);
            return;
        }

        // Step 8: Fetch online users from Redis
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

        // Step 9: Fetch unseen message counts
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

        // Step 10: Combine all data (maintaining the sorted order from Step 5)
        const peers = sortedConversations.map(convo => {
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
                unseenCount: unseenForPeer ? unseenForPeer.unseen_count : 0,
                lastMessageTime: latestMessageMap[convo.conversation_id] || null
            };
        }).filter(peer => peer !== null);

        console.log("Final Peers (ordered by recent messages):", JSON.stringify(peers, null, 2));
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