"use client";

import React from "react";
import ChatPeersItem from "./ChatPeersItem";
import { useAuth } from "../../../context/AuthContext";

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
    const { username } = useAuth();

    // Filter out current user but maintain the order from backend (ordered by recent messages)
    const filteredUsers = chatPeers.filter((u) => u.username !== username);

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