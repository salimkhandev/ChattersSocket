import { MoreHorizontal, MoreVertical, Plus, Send, Smile, Trash2, Users, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import GroupProfile from './GroupProfile';
import ChatInput from "./ChatInput";
const GroupChat = ({ socket, username }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedGroup, setSelectedGroup] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isGroupChatLoading, setIsGroupChatLoading] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    // const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [allGroups, setAllGroups] = useState([]);
    
    // const emojiList = ["😀", "😂", "😍", "❤️", "👍", "🔥", "😊", "🎉"];

    const messagesEndRef = useRef(null);
    const prevChatRef = useRef([]);



    useEffect(() => {

        const prev = prevChatRef.current;
        const isSame =
            prev.length === messages.length &&
            prev.every((msg, i) => msg.message === messages[i]?.message && msg.created_at === messages[i]?.created_at);

        if (!isSame && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }

        // update previous chat after comparison
        prevChatRef.current = messages;
    }, [messages]);

    // Fetch available groups from server and handle group deletion events
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

        // Add listener for profile picture updates
        socket.on("group profile updated", ({ groupID, profile_pic }) => {
            setAllGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === groupID
                        ? { ...group, profile_pic }
                        : group
                )
            );
        });

        // Add listener for group name updates
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

        if (socket) {
            socket.emit("get groups");
        }

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
                console.log({history})
                if  (selectedGroup) {
                    setMessages(
                        history.map((msg) => ({
                            from: msg.sender,
                            message: msg.message,
                            groupName: msg.group_name,
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
        socket.emit("get group history", { groupName: group });
    };

    // const fetchGroupHistory = ( group) => {
    //     console.table('im called')
    //     console.log('im called')
        
    //     socket.emit("get group history", { groupName: group });
    // };

    // const handleSend = () => {
    //     if (!message.trim() || !selectedGroup) return;
    //     socket.emit("group message", {
    //         groupName: selectedGroup,
    //         from: username,
    //         message,
    //     });
    //     setMessage("");
    // };

    // const handleKeyDown = (e) => {
    //     if (e.key === 'Enter' && !e.shiftKey) {
    //         e.preventDefault();
    //         handleSend();
    //     }
    // };

    // Close dropdown when clicking outside
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

    return (
        <div className="flex-1 h-full flex overflow-hidden">
            <Toaster position="top-right" reverseOrder={false} />
            {/* Left Sidebar - Groups List */}
            <div className="w-80 border-r bg-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold">👥 Group Chat</h2>
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
                            className="flex-1 p-2 border rounded"
                        />
                        <button
                            onClick={handleCreateGroup}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Create
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="font-semibold text-gray-700 mb-2">All Groups</h3>
                    <div className="space-y-2">
                        {allGroups.length === 0 && (
                            <p className="text-sm text-gray-400">No groups yet</p>
                        )}
                        {allGroups.map((group, idx) => (
                            <div
                                key={idx}
                                className="mb-3"
                            >
                                <div
                                    onClick={() => handleGroupSelect(group.name)}
                                    className={`flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm border 
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
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {group.name}
                                        </h3>

                                        {group.created_by != username &&
                                            <p className="text-sm text-gray-500 truncate">
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
                                                <MoreVertical className="w-5 h-5 text-gray-500" />
                                            </button>

                                            {openMenuId === group.id && (
                                                <div
                                                    className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200 py-1"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
                                                                socket.emit("delete group", {
                                                                    groupID: group.id,
                                                                    name: group.name
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
            <div className="flex-1 flex flex-col bg-gray-50">
                {selectedGroup ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-white border-b">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                {selectedGroup}
                            </h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {isGroupChatLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">Loading messages...</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex mb-4 ${msg.from === username ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`px-4 py-2 rounded-lg max-w-[70%] ${msg.from === username
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white border text-gray-800'
                                                }`}
                                        >
                                            <div className="text-xs opacity-75 mb-1">{msg.from===username ? 'You' : msg.from}</div>
                                            <p className="break-words flex-1">
                                                {msg.deleted_for?.includes(username) ? (
                                                    <span className="italic text-gray-400">Deleted for you</span>
                                                ) : msg.is_deleted_for_everyone ? (
                                                    <span className="italic text-gray-400">This message was deleted for everyone</span>
                                                ) : (
                                                    msg.message
                                                )}
                                            </p>

                                            {msg.from === username && !msg.deleted_for.includes(username)
                                                && !msg.is_deleted_for_everyone && (
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
                                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                            title="Message options"
                                                            aria-label="Message options"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4" />
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
                                                                <div className="absolute right-0 mt-1 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
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
                                                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        <span>Delete for everyone</span>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
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
                                                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                                        title="Message options"
                                                        aria-label="Message options"
                                                    >
                                                        <MoreHorizontal className="w-4 h-4" />
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
                                                            <div className="absolute left-0 mt-1 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
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


                                            {msg.created_at && (
                                                <div className="text-xs opacity-75 mt-1">
                                                    {new Date(msg.created_at).toLocaleTimeString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
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
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a group to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupChat;
