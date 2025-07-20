"use client";

import React from "react";
import OnlineUserItem from "./OnlineUserItem";

const OnlineUserList = ({
    onlineUsers,
    username,
    selectedReceiver,
    setSelectedReceiver,
    setIsChattingWindowOpen,
    setIsChatLoading,
    getMessagesHistory,
    isTyping,
    isChattingWindowOpen,
}) => {
    const filteredUsers = onlineUsers
        .filter((u) => u.username !== username)
        .sort((a, b) => a.username.localeCompare(b.username));

    return (
        <div>
            {filteredUsers.length === 0 && (
                <p className="text-sm text-gray-400 italic">No one else is online</p>
            )}
            {filteredUsers.map((user, idx) => (
                <OnlineUserItem
                    key={idx}
                    user={user}
                    username={username}
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

export default React.memo(OnlineUserList);
