import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import GroupChat from "./Components/GroupChat";



import UserProfileUpload from "./Components/UserProfile";
// import profilePic from './Components/image.png';
import { io } from "socket.io-client";

import {
  LogOut,
  MessageCircle,
  MessageSquareMore,
  MoreHorizontal,
  Send,
  Smile,
  Trash2,
  UserPlus,
  Users,
  X
} from "lucide-react";

// const socket = io("http://localhost:3000");

// const socket = io("https://5dbb6c84-cb5e-4423-ba04-72e6a621809a-00-7sp7cj9ozrz2.spock.replit.dev/", {
//   reconnection: true,
//   reconnectionAttempts: Infinity,
//   reconnectionDelay: 2000,
// });

const socket = io("http://localhost:3000", {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
});
// const socket = io("https://6f5c0ecc-d764-4d9b-99d7-ed5849f753b0-00-3qdthpdkcdg9n.worf.replit.dev");


export default function ChatApp() {
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);  // track when name is ready

  const [username, setUsername] = useState(localStorage.getItem("chat_user") || "");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isChattingWindowOpen, setIsChattingWindowOpen] = useState(false);
  // const [localDeleted, setLocalDeleted] = useState({});
  // const [localDeletedEveryone, setLocalDeletedEveryone] = useState({});

  const [activeTab, setActiveTab] = useState("people"); // or "groups"

  const emojiList = ["😀", "😂", "😍", "😎", "🥳", "🔥", "👍", "🎉", "😢", "🤔", "👏", "❤️"];
  
  // Optimize repeated deleted message checks
  const isMessageDeletedForUser = useCallback((msg) => {
    return msg.deleted_for?.split(",").map(s => s.trim()).includes(username);
  }, [username]);
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingThrottleRef = useRef(null);
  const prevChatRef = useRef([]);



  useEffect(() => {

    const prev = prevChatRef.current;
    const isSame =
      prev.length === chat.length &&
      prev.every((msg, i) => msg.message === chat[i]?.message && msg.created_at === chat[i]?.created_at);

    if (!isSame && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // update previous chat after comparison
    prevChatRef.current = chat;
  }, [chat]);

  useEffect(() => {
    if (!username || !selectedReceiver) return;

    const markSeen = () => {
      if (document.visibilityState === "visible") {
        socket.emit("mark messages seen", {
          sender: selectedReceiver,
          receiver: username,
        });
      }
    };

    const interval = setInterval(markSeen, 2000);
    document.addEventListener("visibilitychange", markSeen);

    // Call immediately if tab is visible
    markSeen();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", markSeen);
    };
  }, [selectedReceiver, username]);

  // Cleanup typing timers when receiver changes
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (typingThrottleRef.current) {
        clearTimeout(typingThrottleRef.current);
        typingThrottleRef.current = null;
      }
    };
  }, [selectedReceiver]);

  const getMessagesHistory = ({ sender, receiver }) => {
    socket.emit("get chat history", {
      sender,
      receiver,
    });
  };

  useEffect(() => {
    console.log('over all chat histrory🚚😄', chat);

    const handleTyping = (status) => {
      // Only show typing if the typer is the one you're chatting with
      if (status.isTyping) {
        setIsTyping(status);
      } else {
        setIsTyping({ isTyping: false });
      }
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping); // cleanup to avoid duplicate listeners
    };
  }, [selectedReceiver]);
  const sendUsernameEvent = () => {
    if (username) {
      socket.emit("username", { username });
      socket.on("all names", ({ names }) => {
        console.log("✅ Username updated:", username);
        const user = names.find((n) => n.username === username);
        setFullName(user?.name?.trim() || "");
        setNameLoaded(true);
      });



      socket.on("chat message", (msg) => {
        if (msg.from !== username) {
          const notificationSound = new Audio("/notification/notification-sound.mp3");
          notificationSound.volume = 0.3
          notificationSound.play().catch((err) => {
            console.warn("🔇 Sound blocked by browser:", err);
          });
        }


        if (msg.from === selectedReceiver || msg.from === username) {
          setChat((prevMessages) => {
            const mergedMap = new Map();

            [...prevMessages, msg].forEach((m) => {
              const existing = mergedMap.get(m.id);
              if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
                mergedMap.set(m.id, m);
              }
            });

            return Array.from(mergedMap.values()).sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
          });

          console.log("MSG FROM:", msg.from, "SELECTED:", selectedReceiver, "USERNAME:", username);
        } else {




          if (
            msg.from !== username && !selectedReceiver
          ) {
            toast.success(`New message from @${msg.from}`, {
              icon: "💬",
              duration: 3000,
              style: {
                background: "#333",
                color: "#fff",
              },
            });


          }
        }


      });

      socket.on("online users", setOnlineUsers);

    }
  }

  useEffect(() => {
    setNameLoaded(true);
    const mergeAndDeduplicate = (arr1, arr2) => {
      const mergedMap = new Map();

      [...arr1, ...arr2].forEach((msg) => {
        const existing = mergedMap.get(msg.id);

        const msgTime = new Date(msg.seen_at || msg.created_at);
        const existingTime = existing ? new Date(existing.seen_at || existing.created_at) : 0;

        const seenAtChanged =
          msg.seen_at && (!existing?.seen_at || msg.seen_at !== existing.seen_at);

        const deletedForEveryoneChanged =
          msg.is_deleted_for_everyone && !existing?.is_deleted_for_everyone;

        if (
          !existing ||
          msgTime > existingTime ||
          seenAtChanged ||
          deletedForEveryoneChanged // ✅ NEW CONDITION
        ) {
          mergedMap.set(msg.id, msg);
        }
      });

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    };



    // ✅ Handle login response
    const handleLogin = ({ success, message }) => {
      setIsLoggedIn(success);
      setError(success ? "" : message);
    };

    // ✅ Handle chat history response
    const handleChatHistory = (messagesFromDB) => {
      const formattedMessages = messagesFromDB.map((msg) => ({
        from: msg.sender,
        to: msg.receiver,
        // message: "im from db",
        message: msg.message,
        created_at: msg.created_at,
        seen: msg.seen,
        seen_at: msg.seen_at, // ✅ Include this
        id: msg.id,
        deleted_for: msg.deleted_for,
        is_deleted_for_everyone: msg.is_deleted_for_everyone,
      }));


      setChat((prevMessages) => {
        console.log("prevMessages", prevMessages);
        console.log("formattedMessages", formattedMessages);
        return mergeAndDeduplicate(prevMessages, formattedMessages);

      });

      setIsChatLoading(false);
    };


    // 🔌 Register listeners
    socket.on("isLoggedIn", handleLogin);
    socket.on("chat history", handleChatHistory);

    // Send username event to server
    sendUsernameEvent();

    // 🔁 Cleanup listeners on unmount or dependency change
    return () => {
      socket.off("isLoggedIn", handleLogin);
      socket.off("chat history", handleChatHistory);
    };
  }, [username, selectedReceiver]);

  const handleLogin = (input) => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return alert("❌ Please enter a username");
    setUsername(trimmed);
    localStorage.setItem("chat_user", trimmed);
    socket.emit("username", { username: trimmed });
    console.log('this is the username😡', username);
    socket.connect();

  };

  const sendMessage = () => {
    if (!message.trim() || !selectedReceiver) {
      return alert("❌ Please select a user and write a message");
    }
    socket.emit('username', { username })
    socket.emit("chat messages", {
      sender: username,
      receiver: selectedReceiver,
      message: message.trim(),
    });

    setMessage("");
    socket.emit("typing", {
      isTyping: false,
      sender: username,
      receiver: selectedReceiver,
    });
  };

  const handleTyping = useCallback((e) => {
    // Update message state immediately for responsive UI
    setMessage(e.target.value);
    
    // Throttle typing indicator emissions to reduce network overhead
    if (!typingThrottleRef.current) {
      // Only emit typing event if not already typing
      if (!isTyping[selectedReceiver]) {
        socket.emit("typing", {
          isTyping: true,
          sender: username,
          receiver: selectedReceiver,
        });
      }
      
      // Throttle further emissions for 300ms
      typingThrottleRef.current = setTimeout(() => {
        typingThrottleRef.current = null;
      }, 300);
    }
    
    // Debounce the stop typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        isTyping: false,
        sender: username,
        receiver: selectedReceiver,
      });
    }, 1000); // Increased to 1 second for better UX
  }, [username, selectedReceiver, isTyping]);

  const logout = () => {
    localStorage.removeItem("chat_user");
    setUsername("");
    setIsLoggedIn(false);
    setChat([]);
    setOnlineUsers([]);
    setSelectedReceiver("");
    socket.disconnect();
  };

  const closeChat = () => {
    setSelectedReceiver("");
    setChat([]);
    setShowEmojiPicker(false);
    setIsChattingWindowOpen(false);
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && selectedReceiver) {
        closeChat();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedReceiver]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative">
      {!username || !isLoggedIn ? (
        <div className="bg-white shadow-2xl p-8 rounded-xl w-full max-w-sm text-center animate-fadeIn">
          <UserPlus className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Join Chat</h2>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Enter your username"
            onKeyDown={(e) => e.key === "Enter" && handleLogin(e.target.value)}
          />
          <button
            onClick={(e) => handleLogin(e.target.previousElementSibling?.value || "")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition"
          >
            Join
          </button>
          {error && <p className="text-red-500 mt-3 text-sm animate-pulse">{error}</p>}
        </div>
      ) : (
        <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden h-[calc(100vh-2rem)]">
          {/* Top Navigation Bar */}
          <div className="bg-white border-b p-4 flex items-center justify-between shrink-0 z-20">
            <UserProfileUpload nameLoaded={nameLoaded} username={username} fullName={fullName} setFullName={setFullName} socket={socket} />
            
            {/* Center Toggle Buttons */}
            <div className="flex bg-gray-100 p-0.5 rounded-full relative">
              <div 
                className={`absolute inset-0.5 bg-blue-600 rounded-full transition-transform duration-200 ease-in-out ${
                  activeTab === "people" ? 'w-[50%] left-0' : 'w-[50%] translate-x-full'
                }`}
              />
              <button
                onClick={() => setActiveTab("people")}
                className={`w-[50%] px-6 py-1.5 rounded-full font-medium transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 relative z-10 ${
                  activeTab === "people"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                <Users className="w-4 h-4" />
                People
              </button>
              <button
                onClick={() => setActiveTab("groups")}
                className={`w-[50%] px-6 py-1.5 rounded-full font-medium transition-colors duration-200 ease-in-out flex items-center justify-center gap-2 relative z-10 ${
                  activeTab === "groups"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Groups
              </button>
            </div>

            <button
              onClick={logout}
              className="text-red-500 hover:text-red-600 text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative overflow-hidden">
            {/* People Tab */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out transform ${
              activeTab === "people" 
                ? "translate-x-0 opacity-100 z-10" 
                : "-translate-x-full opacity-0 pointer-events-none z-0"
            }`}>
              <div className="w-full h-full flex">
                {/* People content */}
                <aside className="w-80 bg-white border-r p-5 flex flex-col">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-indigo-600 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      
                      Online Users
                    </h2>
                    <button
                      onClick={logout}
                      className="text-red-500 hover:underline text-sm flex items-center gap-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto mt-2 space-y-2">
                    {onlineUsers.length <= 1 && (
                      <p className="text-sm text-gray-400 italic">No one else is online</p>
                    )}
                    {onlineUsers
                      .filter((u) => u.username !== username)
                      .sort((a, b) => a.username.localeCompare(b.username)) // 👈 Alphabetical order
                      .map((user, idx) => {
                        const unseen = user.sentUnseenMessages?.find(
                          (m) => m.receiver === username
                        )?.unseen_count;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setSelectedReceiver(user.username);
                              setIsChattingWindowOpen(true)

                              setIsChatLoading(true);
                              getMessagesHistory({ sender: username, receiver: user.username });
                            }}
                            className={`group cursor-pointer p-3 rounded-lg flex items-center gap-4 transition-all ${selectedReceiver === user.username
                              ? "bg-indigo-100 text-indigo-700 font-semibold shadow-sm"
                              : "hover:bg-gray-100"
                              }`}
                          >
                            {/* Avatar or fallback */}
                            {user.profilePic ? (
                              <img
                                src={user.profilePic}
                                alt="profile"
                                className="w-10 h-10 rounded-full object-cover border shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-indigo-200 text-indigo-800 font-bold flex items-center justify-center rounded-full shadow-sm">
                                {user.fName?.[0]?.toUpperCase() || "?"}
                              </div>
                            )}

                            {/* Name and username */}
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-4">{user.fName}</p>
                              {isTyping.typer === user.username && !isChattingWindowOpen ? (
                                <p className="text-[11px] text-purple-500 animate-pulse mt-0.5">
                                  typing...
                                </p>) : (

                                <p className="text-xs text-gray-500">@{user.username}</p>
                              )
                              }
                            </div>

                            {/* Unread badge */}
                            {unseen > 0 && selectedReceiver !== user.username && (
                              <div className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                                {unseen}
                              </div>
                            )}
                          </div>
                        );
                      })}



                  </div>
                </aside>
                {selectedReceiver && (
                  <main className="flex-1 flex flex-col">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <MessageSquareMore className="w-5 h-5 text-purple-600" />
                          Chat with{" "}
                          <span className="text-indigo-600">
                            {onlineUsers.find(u => u.username === selectedReceiver)?.fName || selectedReceiver}
                          </span>
                        </h1>
                        <button
                          onClick={closeChat}
                          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title="Close chat"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto rounded-lg bg-gray-50 p-4 border shadow-inner space-y-4">
                        {isChatLoading ? (
                          <p className="text-center text-gray-400 italic">Loading chat...</p>
                        ) : (
                          chat.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.from === username ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`px-4 py-2 rounded-xl max-w-xs text-sm shadow-sm ${msg.from === username
                                  ? "bg-green-200 text-gray-900"
                                  : "bg-white text-gray-900 border"
                                }`}
                              >
                                {/* Message content */}
                                <p className="text-xs text-gray-500 mb-1">
                                  {msg.from === username ? "You" : msg.from}{" "}
                                  {msg.from === username ? (
                                    msg.seen ? (
                                      <div className="relative group inline-block">
                                        {!msg.is_deleted_for_everyone && !isMessageDeletedForUser(msg) && (
                                          <span className="text-[10px] text-blue-600 ml-2">Seen</span>
                                        )}
                                        {msg.seen_at && !isMessageDeletedForUser(msg) && !msg.is_deleted_for_everyone && (
                                          <span className="absolute bottom-full mb-1 left-0 text-[10px] text-gray-500 bg-white px-1 w-max rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            {new Date(msg.seen_at).toLocaleString("en-US", {
                                              timeZone: "Asia/Karachi",
                                              month: "short",
                                              day: "2-digit",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-gray-400 ml-2">Unseen</span>
                                    )
                                  ) : null}
                                </p>

                                <div className="flex items-start justify-between gap-2">
                                  <p className="break-words flex-1">
                                    {isMessageDeletedForUser(msg)
                                      ? (
                                        <span className="italic text-gray-400">Deleted for you</span>
                                      ) : msg.is_deleted_for_everyone ? (
                                        <span className="italic text-gray-400">This message was deleted for everyone</span>
                                      ) : (
                                        msg.message
                                      )}
                                  </p>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {msg.created_at && (
                                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                        {new Date(msg.created_at).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    )}

                                    {/* Message Options */}
                                    {msg.from === username && !isMessageDeletedForUser(msg) && !msg.is_deleted_for_everyone ? (
                                      <div className="relative inline-block">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setChat((prev) =>
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
                                              onClick={() => setChat(prev =>
                                                prev.map(m => ({ ...m, showOptions: false }))
                                              )}
                                            />

                                            {/* Dropdown menu */}
                                            <div className="absolute right-0 mt-1 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setChat((prev) =>
                                                    prev.map((m) =>
                                                      m.id === msg.id
                                                        ? { ...m, deleted_for: username, showOptions: false }
                                                        : m
                                                    )
                                                  );
                                                  socket.emit("delete for me", {
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
                                                  setChat((prev) =>
                                                    prev.map((m) =>
                                                      m.id === msg.id
                                                        ? { ...m, is_deleted_for_everyone: true, showOptions: false }
                                                        : m
                                                    )
                                                  );
                                                  socket.emit("delete for everyone", {
                                                    username,
                                                    messageId: msg.id,
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
                                    ) : msg.from !== username && !isMessageDeletedForUser(msg) && !msg.is_deleted_for_everyone && (
                                      <div className="relative inline-block">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setChat((prev) =>
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
                                              onClick={() => setChat(prev =>
                                                prev.map(m => ({ ...m, showOptions: false }))
                                              )}
                                            />

                                            {/* Dropdown menu */}
                                            <div className="absolute left-0 mt-1 z-20 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setChat((prev) =>
                                                    prev.map((m) =>
                                                      m.id === msg.id
                                                        ? { ...m, deleted_for: username, showOptions: false }
                                                        : m
                                                    )
                                                  );
                                                  socket.emit("delete for me", {
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
                            </div>

                          )))

                        }
                        {isTyping.typer === selectedReceiver && (
                          <p className="text-sm italic text-gray-400">{isTyping.typer} is typing...</p>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <div className="mt-4 bg-white rounded-lg border shadow-sm relative">
                        {showEmojiPicker && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-xl shadow-lg p-3 grid grid-cols-6 gap-2 z-50">
                            {emojiList.map((emoji, idx) => (
                              <button
                                key={idx}
                                className="text-xl hover:scale-125 transition-transform"
                                onClick={() => {
                                  setMessage((prev) => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="p-3 flex items-center gap-2">
                          <input
                            className="flex-1 px-4 py-2 text-base focus:outline-none"
                            placeholder="Type a message..."
                            value={message}
                            onChange={handleTyping}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Insert Emoji"
                          >
                            <Smile className="w-5 h-5 text-gray-500" />
                          </button>
                          <button
                            onClick={sendMessage}
                            disabled={!message.trim() || !selectedReceiver}
                            className={`flex items-center gap-1 px-4 py-2 rounded-lg text-white transition ${
                              message.trim() && selectedReceiver
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-gray-300 cursor-not-allowed"
                            }`}
                          >
                            <Send className="w-4 h-4" />
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  </main>
                )}
              </div>
            </div>

            {/* Groups Tab */}
            <div className={`absolute inset-0 w-full h-full flex transition-all duration-300 ease-in-out transform ${
              activeTab === "groups" 
                ? "translate-x-0 opacity-100 z-10" 
                : "translate-x-full opacity-0 pointer-events-none z-0"
            }`}>
              <GroupChat socket={socket} username={username} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}