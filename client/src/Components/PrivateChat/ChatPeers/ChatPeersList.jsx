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
    const { username} = useAuth();

    const filteredUsers = chatPeers
        .filter((u) => u.username !== username)
        .sort((a, b) => a.username.localeCompare(b.username));

    return (
        <div>
            {filteredUsers.length === 0 && (
                <p className="text-sm text-gray-400 italic">No one else is online</p>
            )}
            {filteredUsers.map((user, idx) => (
                <ChatPeersItem
                    key={idx}
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
