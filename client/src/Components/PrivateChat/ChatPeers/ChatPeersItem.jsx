"use client";

import { MoreVertical } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../context/AuthContext";
import { useMedia } from '../../../context/MediaContext';
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
    const { setChat } = useMedia();
    const { username, id, socket } = useAuth();
    const { onlineUsers } = useOnlineUsers();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef(null);

    // unseen count from unseenMessages array
    let baseUnseen = user.unseenCount || 0;

    // find peer in onlineUsers
    const peer = onlineUsers.find((u) => u.username === user.username);

    // unseen from online state
    const unseenOnline = peer?.sentUnseenMessages?.find(
        (m) => m.receiver === username
    )?.unseen_count;

    // always prefer unseenOnline if it's defined
    if (typeof unseenOnline === "number") {
        baseUnseen = unseenOnline;
        user.unseenCount = unseenOnline;
    }

    const unseen = baseUnseen;

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleClick = () => {
        setChat([]);
        setSelectedReceiver(user.username);
        setIsChattingWindowOpen(true);
        setIsChatLoading(true);
        getMessagesHistory({ sender: username, receiver: user.username });
    };

    const handleDeleteChat = async () => {

        if (isDeleting) return;

        setIsDeleting(true);
        setShowDeleteModal(false);
        setShowMenu(false);

        try {
            socket.emit('deleteChat', {
                conversationId: user.conversation_id,
                userId: id
            });

            console.log('user.conversation_id', user.conversation_id);
            console.log('id', id);

            socket.off('deleteChatError');

            socket.on('deleteChatError', (error) => {
                console.error('Error deleting chat:', error);
                alert('Failed to delete chat. Please try again.');
                setIsDeleting(false);
            });

        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Failed to delete chat. Please try again.');
            setIsDeleting(false);
        }
    };

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        setShowMenu(false);
        setShowDeleteModal(true);
    };

    const handleMenuClick = (e) => {
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    // Add this function to handle the dropdown menu area
    const handleMenuAreaClick = (e) => {
        e.stopPropagation();
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
                {onlineUsers.map((u, idx) => u.isOnline && u.username == user.username && (
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
            {unseen > 0 && selectedReceiver !== user.username && (
                <div className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                    {unseen}
                </div>
            )}

            {/* Three dots menu */}
            <div className="relative" ref={menuRef} onClick={handleMenuAreaClick}>
                <button
                    onClick={handleMenuClick}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button
                            onClick={handleRemoveClick}
                            disabled={isDeleting}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'Deleting...' : 'Remove'}
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && createPortal(
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-2">
                            Remove '{user.fName}'
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to remove this chat? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteChat(); }}
                                disabled={isDeleting}
                                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default React.memo(ChatPeersItem);