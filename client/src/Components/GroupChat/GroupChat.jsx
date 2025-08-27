import { MoreHorizontal, MoreVertical, Plus, Send, Smile, Trash2, Users, X, ArrowLeft, Edit3 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import GroupProfile from './GroupProfile';
import EditMessageModal from '../PrivateChat/EditMessageModal';

import ChatInput from "./ChatInput";
import { useAuth } from "../../context/AuthContext";



const GroupChat = ({ socket }) => {
    const { username } = useAuth();

    const [groupName, setGroupName] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [messages, setMessages] = useState([]);
    const [isGroupChatLoading, setIsGroupChatLoading] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [allGroups, setAllGroups] = useState([]);
    const [showSidebar, setShowSidebar] = useState(true);
    const [editModal, setEditModal] = useState({ isOpen: false, messageId: null, currentText: '' });

    const messagesEndRef = useRef(null);
    const prevChatRef = useRef([]);

    useEffect(() => {
        const prev = prevChatRef.current;
        
        // Check if it's just a message edit (same length, same IDs, same created_at)
        const isMessageEdit = prev.length === messages.length && 
            prev.length > 0 &&
            prev.every((msg, i) => 
                messages[i] && 
                msg.id === messages[i].id && 
                msg.created_at === messages[i].created_at
            );
        
        // Only scroll if it's not a message edit and chat is not loading
        if (!isMessageEdit && !isGroupChatLoading && messagesEndRef.current) {
            // Use setTimeout to ensure DOM is fully rendered before scrolling
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
        
        prevChatRef.current = messages;
    }, [messages, isGroupChatLoading]);

    useEffect(() => {
        socket.on("group delete success", ({ groupName }) => {
            toast.success(`Group "${groupName}" deleted successfully`, {
                duration: 3000,
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: '#fff',
                },
                icon: '🗑️'
            });
            // Update groups list after deletion
            socket.emit("get groups");
            // Clear selected group if it was deleted
            if (selectedGroup === groupName) {
                setSelectedGroup("");
                setMessages([]);
            }
        });

        socket.on("group delete failed", ({ message }) => {
            toast.error(`Failed to delete group: ${message}`, {
                duration: 3000,
                position: 'top-center',
                style: {
                    background: '#EF4444',
                    color: '#fff',
                },
                icon: '❌'
            });
        });

        socket.on("group profile updated", ({ groupID, profile_pic }) => {
            setAllGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === groupID
                        ? { ...group, profile_pic }
                        : group
                )
            );
        });

        socket.on("group name updated", ({ groupID, name }) => {
            setAllGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === groupID
                        ? { ...group, name }
                        : group
                )
            );
        });

        socket.on("groups list", (groups) => {
            setAllGroups(groups);
        });

        return () => {
            socket.off("group delete success");
            socket.off("group delete failed");
            socket.off("group profile updated");
            socket.off("group name updated");
            socket.off("groups list");
        };
    }, [socket, selectedGroup]);

    useEffect(() => {
        if (socket) {
            socket.on("group message", (data) => {
                if (data.groupName === selectedGroup) {
                    setMessages((prev) => [...prev, data]);
                }
            });

            // ✅ Handle group history
            socket.on("group history", (history) => {
                console.log({ history })
                if (selectedGroup) {
                    setMessages(
                        history.map((msg) => ({
                            from: msg.sender,
                            message: msg.message,
                            groupName: msg.group_name,
                            updated: msg.updated,
                            updated_at: msg.updated_at,
                            senderfullname: msg.senderfullname,
                            sender_profile_pic: msg.sender_profile_pic,
                            created_at: msg.created_at,
                            deleted_for: msg.deleted_for || [],
                            is_deleted_for_everyone: msg.is_deleted_for_everyone,
                            id: msg.id,
                            showOptions: false,
                        }))
                    );
                }
                setIsGroupChatLoading(false);
            });
        }

        return () => {
            socket.off("group message");
            socket.off("group history"); // 👈 cleanup
        };
    }, [socket, selectedGroup]);

    const handleCreateGroup = () => {
        if (!groupName.trim()) return;
        socket.emit("create group", { groupName, username });
        setGroupName("");
    };

    const handleGroupSelect = (group) => {
        setSelectedGroup(group);
        setIsGroupChatLoading(true);
        setMessages([]); // clear old messages
        socket.emit("join group", { groupName: group, username });
        socket.emit("get group history", { groupName: group, sender: username });

        // Hide sidebar on mobile when group is selected
        if (window.innerWidth < 768) {
            setShowSidebar(false);
        }
    };

    const handleEditMessage = (messageId, currentText) => {
        setEditModal({
            isOpen: true,
            messageId,
            currentText
        });
    };

    const handleSaveEdit = (newMessage) => {
        if (!newMessage || !editModal.messageId) return;

        // Optimistically update the message in UI
        setMessages((prev) =>
            prev.map((m) =>
                m.id === editModal.messageId
                    ? { ...m, message: newMessage, updated: true, showOptions: false }
                    : m
            )
        );

        // Emit socket event to update on backend & other users
        socket.emit("edit group message", {
            messageId: editModal.messageId,
            newMessage: newMessage,
            groupName: selectedGroup
        });
    };

    // close clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.group-menu')) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // Add keyboard event handlers
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedGroup) {
                setSelectedGroup("");
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedGroup]);

    const handleGroupNameKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCreateGroup();
        }
    };

    const handleBackToGroups = () => {
        setShowSidebar(true);
        setSelectedGroup("");
    };

    return (
        <div className="flex-1 h-full flex overflow-hidden">
            {/* Left Sidebar - Groups List */}
            <div className={`${showSidebar ? 'flex' : 'hidden md:flex'
                } w-full md:w-80 border-r bg-white p-3 md:p-4 flex-col absolute md:relative z-10 md:z-auto h-full md:h-auto`}>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg md:text-xl font-bold">👥 Group Chat</h2>
                    <button
                        onClick={() => setShowCreateGroup(!showCreateGroup)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Create New Group"
                    >
                        {showCreateGroup ? (
                            <X className="w-5 h-5 text-gray-600" />
                        ) : (
                            <Plus className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showCreateGroup ? 'max-h-[100px] opacity-100 mb-4' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Create new group..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            onKeyDown={handleGroupNameKeyDown}
                            className="flex-1 p-2 border rounded text-sm md:text-base"
                        />
                        <button
                            onClick={handleCreateGroup}
                            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded hover:bg-green-700 text-sm md:text-base"
                        >
                            Create
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="font-semibold text-gray-700 mb-2 text-sm md:text-base">All Groups</h3>
                    <div className="space-y-2">
                        {allGroups.length === 0 && (
                            <p className="text-sm text-gray-400">No groups yet</p>
                        )}
                        {allGroups.map((group, idx) => (
                            <div
                                key={idx}
                                className="mb-2 md:mb-3"
                            >
                                <div
                                    onClick={() => handleGroupSelect(group.name)}
                                    className={`flex items-center space-x-2 md:space-x-3 p-2 md:p-3 bg-white rounded-lg md:rounded-xl shadow-sm border 
                                            ${selectedGroup === group.name ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} 
                                            hover:border-blue-300 hover:shadow-md cursor-pointer transition-all duration-200`}
                                >
                                    <GroupProfile
                                        groupID={group.id}
                                        groupName={group.name}
                                        setGroupName={(newName) => {
                                            const updatedGroups = allGroups.map(g =>
                                                g.id === group.id ? { ...g, name: newName } : g
                                            );
                                            setAllGroups(updatedGroups);
                                        }}
                                        socket={socket}
                                        username={username}
                                        created_by={group.created_by}
                                    />

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">
                                            {group.name}
                                        </h3>

                                        {group.created_by != username &&
                                            <p className="text-xs md:text-sm text-gray-500 truncate">
                                                admin: {group.created_by}
                                            </p>}
                                    </div>

                                    {group.created_by === username && (
                                        <div className="relative group-menu">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === group.id ? null : group.id);
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                            >
                                                <MoreVertical className="w-4 md:w-5 h-4 md:h-5 text-gray-500" />
                                            </button>

                                            {openMenuId === group.id && (
                                                <div
                                                    className="absolute right-0 mt-1 w-44 md:w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200 py-1"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                                                                socket.emit("delete group", {
                                                                    groupID: group.id,
                                                                    groupName: group.name,
                                                                    username
                                                                });
                                                                setOpenMenuId(null);
                                                            }
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Group
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${showSidebar ? 'hidden md:flex' : 'flex'
                } flex-1 flex-col bg-gray-50 w-full`}>
                {selectedGroup ? (
                    <>
                        {/* Header */}
                        <div className="p-3 md:p-4 bg-white border-b">
                            <div className="flex items-center gap-2 md:gap-3">
                                <button
                                    onClick={handleBackToGroups}
                                    className="md:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
                                    <Users className="w-4 md:w-5 h-4 md:h-5 text-blue-500" />
                                    {selectedGroup}
                                </h2>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-3 md:p-4">
                            {isGroupChatLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500 text-sm md:text-base">Loading messages...</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const prevMessage = idx > 0 ? messages[idx - 1] : null;

                                    const showProfilePic =
                                        (
                                            idx === 0 ||
                                            !prevMessage ||
                                            prevMessage.from !== msg.from
                                        );

                                    return <div
                                        key={idx}
                                        className={`flex mb-3 md:mb-4 ${msg.from === username ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {msg.from !== username && (
                                            showProfilePic ? (
                                                <img
                                                    src={msg.sender_profile_pic}
                                                    alt="profile"
                                                    className="w-6 md:w-8 h-6 md:h-8 rounded-full mt-1 mr-2"
                                                />
                                            ) : (
                                                <div className="w-6 md:w-8 mr-2" /> // empty space for alignment
                                            )
                                        )}
                                        <div
                                            className={`px-3 md:px-4 py-2 rounded-lg max-w-[85%] md:max-w-[70%] ${msg.from === username
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white border text-gray-800'
                                                }`}
                                        >
                                            <div className="text-xs opacity-75 mb-1">{msg.from === username ? 'You' : msg.senderfullname}</div>
                                            <p className="break-words whitespace-pre-wrap text-sm md:text-base" style={{ overflowWrap: 'anywhere' }}>
                                                {msg.deleted_for?.includes(username) ? (
                                                    <span className="italic text-gray-400">Deleted for you</span>
                                                ) : msg.is_deleted_for_everyone ? (
                                                    <span className="italic text-gray-400">This message was deleted for everyone</span>
                                                ) : (
                                                    msg.message
                                                )}
                                            </p>
                                            <p>
                                                {msg.updated && msg.from !== username && <span className="italic text-gray-400 text-xs">edited at {new Date(msg.updated_at).toLocaleString("en-US", {
                                                    timeZone: "Asia/Karachi",
                                                    month: "short",
                                                    day: "2-digit",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })}</span>
                                                }
                                            </p>

                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs opacity-75">{new Date(msg.created_at).toLocaleTimeString()}</span>

                                                {/* Message Options for current user */}
                                                {msg.from === username && !msg.deleted_for.includes(username) && !msg.is_deleted_for_everyone && (
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setMessages((prev) =>
                                                                    prev.map((m) =>
                                                                        m.id === msg.id
                                                                            ? { ...m, showOptions: !m.showOptions }
                                                                            : { ...m, showOptions: false }
                                                                    )
                                                                );
                                                            }}
                                                            className="text-green-200 hover:text-green-900 p-1 rounded-full hover:bg-blue-200 transition-colors"
                                                            title="Message options"
                                                            aria-label="Message options"
                                                        >
                                                            <MoreHorizontal className="w-3 md:w-4 h-3 md:h-4" />
                                                        </button>

                                                        {msg.showOptions && (
                                                            <>
                                                                {/* Click outside overlay */}
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() => setMessages(prev =>
                                                                        prev.map(m => ({ ...m, showOptions: false }))
                                                                    )}
                                                                />

                                                                {/* Dropdown menu */}
                                                                <div className="absolute right-0 bottom-full mb-1 z-20 w-40 md:w-44 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setMessages(prev =>
                                                                                prev.map(m => ({ ...m, showOptions: false }))
                                                                            );
                                                                            handleEditMessage(msg.id, msg.message);
                                                                        }}
                                                                        className="block w-full text-left px-3 md:px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Edit3 className="w-3 h-3" />
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setMessages((prev) =>
                                                                                prev.map((m) =>
                                                                                    m.id === msg.id
                                                                                        ? { ...m, deleted_for: username, showOptions: false }
                                                                                        : m
                                                                                )
                                                                            );
                                                                            socket.emit("delete for me group message", {
                                                                                username,
                                                                                messageId: msg.id,
                                                                            });
                                                                        }}
                                                                        className="block w-full text-left px-3 md:px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        Delete for me
                                                                    </button>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setMessages((prev) =>
                                                                                prev.map((m) =>
                                                                                    m.id === msg.id
                                                                                        ? { ...m, is_deleted_for_everyone: true, showOptions: false }
                                                                                        : m
                                                                                )
                                                                            );
                                                                            socket.emit("delete for everyone group message", {
                                                                                username,
                                                                                messageId: msg.id,
                                                                                groupName: selectedGroup
                                                                            });
                                                                        }}
                                                                        className="block w-full text-left px-3 md:px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        <span>Delete for everyone</span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Message Options for other users */}
                                                {msg.from !== username && !msg.deleted_for?.includes(username) && !msg.is_deleted_for_everyone && (
                                                    <div className="relative inline-block">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setMessages((prev) =>
                                                                    prev.map((m) =>
                                                                        m.id === msg.id
                                                                            ? { ...m, showOptions: !m.showOptions }
                                                                            : { ...m, showOptions: false }
                                                                    )
                                                                );
                                                            }}
                                                            className="text-gray-400 opacity-75 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                            title="Message options"
                                                            aria-label="Message options"
                                                        >
                                                            <MoreHorizontal className="w-3 md:w-4 h-3 md:h-4" />
                                                        </button>

                                                        {msg.showOptions && (
                                                            <>
                                                                {/* Click outside overlay */}
                                                                <div
                                                                    className="fixed inset-0 z-10"
                                                                    onClick={() =>
                                                                        setMessages((prev) =>
                                                                            prev.map((m) => ({ ...m, showOptions: false }))
                                                                        )
                                                                    }
                                                                />

                                                                {/* Dropdown menu */}
                                                                <div className="absolute left-0 bottom-full mb-1 z-20 w-44 md:w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setMessages((prev) =>
                                                                                prev.map((m) =>
                                                                                    m.id === msg.id
                                                                                        ? { ...m, deleted_for: username, showOptions: false }
                                                                                        : m
                                                                                )
                                                                            );
                                                                            socket.emit("delete for me group message", {
                                                                                username,
                                                                                messageId: msg.id,
                                                                            });
                                                                        }}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Delete for me
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                })
                            )}
                            <div className="p-3 md:p-5" ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <ChatInput onSend={(text) => {
                            socket.emit("group message", {
                                groupName: selectedGroup,
                                from: username,
                                message: text,
                            });
                        }} />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm md:text-base px-4 text-center">
                        Select a group to start chatting
                    </div>
                )}
            </div>

            {/* Edit Message Modal */}
            <EditMessageModal
                isOpen={editModal.isOpen}
                message={editModal.currentText}
                onClose={() => setEditModal({ isOpen: false, messageId: null, currentText: '' })}
                onSave={handleSaveEdit}
            />
        </div>
    );
};

export default GroupChat;