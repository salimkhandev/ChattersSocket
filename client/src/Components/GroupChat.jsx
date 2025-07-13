import React, { useState, useEffect } from "react";

const GroupChat = ({ socket, username }) => {
    const [groupName, setGroupName] = useState("");
    const [joinedGroups, setJoinedGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [isGroupChatLoading, setIsGroupChatLoading] = useState(false);

    // Fetch available groups from server
    useEffect(() => {
        socket.on("group delete success", ({ groupName }) => {
            alert(`Group "${groupName}" deleted successfully.`);
        });

        socket.on("group delete failed", ({ message }) => {
            alert(`❌ ${message}`);
        });

        return () => {
            socket.off("group delete success");
            socket.off("group delete failed");
        };
    }, [groupName,socket]);

    useEffect(() => {

        if (socket) {
            
            socket.emit("get groups");

            socket.on("groups list", (groups) => setAllGroups(groups));

            socket.on("group message", (data) => {
                if (data.groupName === selectedGroup) {
                    setMessages((prev) => [...prev, data]);
                }
            });


            socket.on("group joined", (data) => {
                setJoinedGroups((prev) => [...new Set([...prev, data.groupName])]);
                if (data.groupName === selectedGroup) {
                    setMessages((prev) => [...prev, { from: "server", message: data.message }]);
                }
            });

            // ✅ Handle group history
            socket.on("group history", (history) => {
                if (selectedGroup) {
                    setMessages(
                        history.map((msg) => ({
                            from: msg.sender,
                            message: msg.message,
                            groupName: msg.group_name,
                            created_at: msg.created_at, // ✅ include timestamp
                        }))
                    );
                }
                setIsGroupChatLoading(false);
            });

        }

        return () => {
            socket.off("groups list");
            socket.off("group message");
            socket.off("group joined");
            socket.off("group history"); // 👈 cleanup
        };
    }, [socket, selectedGroup]);


    const handleCreateGroup = () => {
        if (!groupName.trim()) return;
        socket.emit("create group", { groupName, username });
        setGroupName("");
    };

    const handleJoinGroup = (group) => {
        socket.emit("join group", { groupName: group, username });
        setSelectedGroup(group);
        setIsGroupChatLoading(true); // Show loader

        setMessages([]); // clear old messages

        // 📥 Request group chat history
        socket.emit("get group history", { groupName: group });
    };


    const handleSend = () => {
        if (!message.trim() || !selectedGroup) return;
        socket.emit("group message", {
            groupName: selectedGroup,
            from: username,
            message,
        });
        setMessage("");
    };

    return (
        <div className="p-4 max-w-2xl mx-auto border rounded shadow bg-white">
            <h2 className="text-xl font-bold mb-3">👥 Group Chat</h2>

            <div className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    placeholder="Create new group..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 p-2 border rounded"
                />
                <button
                    onClick={handleCreateGroup}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    Create
                </button>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-700 mb-2">All Groups</h3>
                    {allGroups.length === 0 && (
                        <p className="text-sm text-gray-400">No groups yet</p>
                    )}

                    {allGroups.map((group, idx) => (
                        <div key={idx} className="mb-1 flex items-center justify-between">
                            <button
                                onClick={() => handleJoinGroup(group.name)}
                                className={`px-3 py-1 rounded flex-1 text-left ${joinedGroups.includes(group.name)
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-gray-100 hover:bg-gray-200"
                                    }`}
                            >
                                <div>
                                    <div>{group.name}</div>
                                    <div className="text-xs text-gray-500">created by: {group.created_by}</div>
                                </div>
                            </button>

                            {group.created_by === username && (
                                <button
                                    onClick={() => socket.emit("delete group", { groupName: group.name, username })}
                                    className="ml-2 text-red-500 hover:underline text-xs"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}

                </div>

                <div className="flex-1">
                    {selectedGroup && (
                        <>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-gray-700">
                                    Messages in: {selectedGroup}
                                </h3>
                                <button
                                    onClick={() => setSelectedGroup("")}
                                    className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 transition"
                                >
                                     Close
                                </button>
                            </div>

                            {isGroupChatLoading ? (
                                <p className="text-center text-gray-400 italic">Loading group messages...</p>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className="mb-1">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <strong>{msg.from === username ? "You" : msg.from}</strong>
                                            {msg.created_at && (
                                                <span className="text-xs text-gray-400 ml-2">
                                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <div>{msg.message}</div>
                                    </div>
                                ))
                            )}

                            <div className="flex space-x-2 mt-4">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="flex-1 p-2 border rounded"
                                />
                                <button
                                    onClick={handleSend}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    )}

</div>
            </div>
        </div>
    );
};

export default GroupChat;
