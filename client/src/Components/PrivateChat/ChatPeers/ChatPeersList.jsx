"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import ChatPeersItem from "./ChatPeersItem";

const ChatPeersList = ({
    chatPeers,
    selectedReceiver,
    setSelectedReceiver,
    setIsChattingWindowOpen,
    setIsChatLoading,
    getMessagesHistory,
    isTyping,
    isChattingWindowOpen,
}) => {
    const { username, socket} = useAuth();
    const [localPeers, setLocalPeers] = useState([]);

    // Filter out current user but maintain the order from backend (ordered by recent messages)
    const filteredUsers = localPeers.length > 0 ? localPeers : chatPeers.filter((u) => u.username !== username);

    // Update local peers when chatPeers changes
    useEffect(() => {
        setLocalPeers(chatPeers.filter((u) => u.username !== username));
    }, [chatPeers, username]);

    // Listen for chat deletion events
    useEffect(() => {
        if (!socket) return;

        const handleChatDeleted = (data) => {
            alert("Chat deleted successfully"+data);
            console.log("Chat deleted successfully",data);
            // Remove the deleted conversation from local state
            setLocalPeers(prevPeers => 
                prevPeers.filter(peer => peer.conversation_id !== data.conversationId)
            );
        };

        socket.on('chatDeleted', handleChatDeleted);

        // Cleanup listener on unmount
        return () => {
            socket.off('chatDeleted', handleChatDeleted);
        };
    }, [socket]);

    return (
        <div>
            {filteredUsers.length === 0 && (
                <p className="text-sm text-gray-400 italic">No conversations yet</p>
            )}
            {filteredUsers.map((user, idx) => (
                <ChatPeersItem
                    key={user.id || idx} // Use user.id as key for better performance
                    user={user}
                    selectedReceiver={selectedReceiver}
                    setSelectedReceiver={setSelectedReceiver}
                    setIsChattingWindowOpen={setIsChattingWindowOpen}
                    setIsChatLoading={setIsChatLoading}
                    getMessagesHistory={getMessagesHistory}
                    isTyping={isTyping}
                    isChattingWindowOpen={isChattingWindowOpen}
                />
            ))}
        </div>
    );
};

export default React.memo(ChatPeersList);