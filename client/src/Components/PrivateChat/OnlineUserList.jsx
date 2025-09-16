"use client";

import React, { useEffect } from "react";
import OnlineUserItem from "./OnlineUserItem";
import { useAuth } from "../../context/AuthContext";
import { useOnlineUsers } from "../../context/OnlineUsersContext";

const OnlineUserList = ({
    onlineUsers,
    selectedReceiver,
    setSelectedReceiver,
    setIsChattingWindowOpen,
    setIsChatLoading,
    getMessagesHistory,
    isTyping,
    isChattingWindowOpen,
}) => {
    const { username} = useAuth();
    const { setOnlineUsers } = useOnlineUsers();
    useEffect(() => {
        setOnlineUsers(onlineUsers); // store in context
    }, [onlineUsers]);
    const filteredUsers = onlineUsers
        ?.filter((u) => u.username !== username)
        .sort((a, b) => a.username.localeCompare(b.username));

    return (
        <div>
            {filteredUsers?.length === 0 && (
                <p className="text-sm text-gray-400 italic">No one else is online</p>
            )}
            {filteredUsers?.map((user, idx) => (
                <OnlineUserItem
                    key={idx}
                    user={user}
                    onlineUsers={onlineUsers}
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
