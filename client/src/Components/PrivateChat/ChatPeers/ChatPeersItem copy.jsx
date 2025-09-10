"use client";

import React from "react";
import { useAuth } from "../../../context/AuthContext";
import { useOnlineUsers } from "../../../context/OnlineUsersContext";

const ChatPeersItem = ({
    user,
    selectedReceiver,
    setSelectedReceiver,
    setIsChattingWindowOpen,
    setIsChatLoading,
    getMessagesHistory,
    isTyping,
    isChattingWindowOpen,
}) => {
    const { username } = useAuth();
    const { onlineUsers } = useOnlineUsers();

    // unseen count from unseenMessages array
    const unseen = user.unseenCount || 0;
    const unseenOnline = onlineUsers.sentUnseenMessages?.find(
        (m) => m.receiver === username
    )?.unseen_count;
    const handleClick = () => {
        setSelectedReceiver(user.username);
        setIsChattingWindowOpen(true);
        setIsChatLoading(true);
        getMessagesHistory({ sender: username, receiver: user.username });
    };

    return (
        <div
            onClick={handleClick}
            className={`group cursor-pointer p-3 rounded-lg flex items-center gap-4 transition-all ${selectedReceiver === user.username
                    ? "bg-indigo-100 text-indigo-700 font-semibold shadow-sm"
                    : "hover:bg-gray-100"
                }`}
        >
            {/* Avatar */}
            <div className="relative">
                {user.profile_pic ? (
                    <img
                        src={user.profile_pic}
                        alt="profile"
                        className="w-10 h-10 rounded-full object-cover border shadow-sm"
                    />
                ) : (
                    <div className="w-10 h-10 bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center rounded-full shadow-sm">
                        {user.fName?.[0]?.toUpperCase() || "?"}
                    </div>
                )}

                {/* Online indicator */}
                {onlineUsers.map((u,idx)=>u.isOnline && u.username==user.username && (
                    <span key={idx} className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                ))}
            </div>

            {/* Name and username */}
            <div className="flex-1">
                <p className="text-sm font-medium leading-4">{user.fName}</p>
                {isTyping.typer === user.username && !isChattingWindowOpen ? (
                    <p className="text-[11px] text-purple-500 animate-pulse mt-0.5">
                        typing...
                    </p>
                ) : (
                    <p className="text-xs text-gray-500">@{user.username}</p>
                )}
            </div>

            {/* Unseen messages badge */}
            {unseenOnline > 0 &&
                selectedReceiver !== user.username &&
                onlineUsers?.some((u) => u.username === user.username) ? (
                <div className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                    {unseenOnline}
                </div>
            ) : unseen > 0 && selectedReceiver !== user.username ? (
                <div className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                    {unseen}
                </div>
            ) : null}

        </div>
    );
};

export default React.memo(ChatPeersItem);
