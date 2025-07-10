import React, { useEffect, useState, useRef } from "react";
import GroupChat from "./Components/GroupChat";
import UserProfileUpload from "./Components/UserProfile";
// import profilePic from './Components/image.png';
import { io } from "socket.io-client";

import {
  UserPlus,
  LogOut,
  Send,
  Users,
  MessageSquareMore,
  Smile,
} from "lucide-react";

// const socket = io("http://localhost:3000");

const socket = io("https://8b81f6f7-2710-45c7-9f7a-d10faa8f99b3-00-1biywnnfgs4xq.riker.replit.dev/", {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
});

// const socket = io("http://localhost:3000", {
//   reconnection: true,
//   reconnectionAttempts: Infinity,
//   reconnectionDelay: 2000,
// });
// const socket = io("https://6f5c0ecc-d764-4d9b-99d7-ed5849f753b0-00-3qdthpdkcdg9n.worf.replit.dev");


export default function ChatApp() {
  const [isChatLoading, setIsChatLoading] = useState(false);

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


  const emojiList = ["😀", "😂", "😍", "😎", "🥳", "🔥", "👍", "🎉", "😢", "🤔", "👏", "❤️"];
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [chat]);

  useEffect(() => {



    socket.on("isLoggedIn", ({ success, message }) => {
      setIsLoggedIn(success);
      setError(success ? "" : message);
    });
    socket.on("chat history", (messages) => {
      setChat(messages.map((msg) => ({
        from: msg.sender,
        message: msg.message,
        created_at: msg.created_at, // ✅ keep timestamp
      })));
      setIsChatLoading(false); // stop loading
    });

    if (username) {
      socket.emit("username", { username });
      socket.on("all names", ({ names }) => {
        const user = names.find((n) => n.username === username);
        if (user) setFullName(user.name); // set just the string
      });

      const notificationSound = new Audio("./notification/notification-sound-effect-372475.mp3");

      socket.on("chat message", (msg) => setChat((prev) => [...prev, msg]));
      socket.on("typing", (status) => setIsTyping(status));
      socket.on("online users", setOnlineUsers);

      // ✅ Add sound for private messages here
      socket.on("private message", (msg) => {
        setChat((prev) => [...prev, msg]);

        // Only play sound if the message is from someone else
        if (msg.from !== username) {
          notificationSound.play().catch((err) => {
            console.warn("🔇 Sound blocked by browser:", err);
          });
        }
      });    }

    return () => socket.off();
  }, [username]);

  const handleLogin = (input) => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return alert("❌ Please enter a username");
    setUsername(trimmed);
    localStorage.setItem("chat_user", trimmed);
    socket.emit("username", { username: trimmed });
    socket.connect();
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedReceiver) {
      return alert("❌ Please select a user and write a message");
    }

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

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", {
      isTyping: true,
      sender: username,
      receiver: selectedReceiver,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        isTyping: false,
        sender: username,
        receiver: selectedReceiver,
      });
    }, 500);
  };

  const logout = () => {
    localStorage.removeItem("chat_user");
    setUsername("");
    setIsLoggedIn(false);
    setChat([]);
    setOnlineUsers([]);
    setSelectedReceiver("");
    socket.disconnect();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-8 relative">
      <GroupChat socket={socket} username={username} />
      {isLoggedIn && username && (
        <div className="absolute top-4 left-4">
      

          <UserProfileUpload username={username} fullName={fullName} socket={socket} />
             </div>
      )}


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
        <div className="w-full max-w-6xl h-[36rem] bg-white rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden animate-fadeIn">
          <aside className="w-full md:w-1/3 bg-white border-r p-5 flex flex-col gap-4">
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
                  .map((user, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedReceiver(user.username);
                        setIsChatLoading(true);
                        socket.emit("get chat history", {
                          sender: username,
                          receiver: user.username,
                        });

                      }}
                      className={`cursor-pointer px-4 py-2 rounded-lg flex items-center gap-3 transition ${selectedReceiver === user.username
                          ? "bg-indigo-100 text-indigo-700 font-semibold"
                          : "hover:bg-gray-100"
                        }`}
                    >
                      {user.profilePic && (
                        <img
                          src={user.profilePic}
                          alt="profile"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <span className="block text-sm font-medium text-gray-800">
                          {user.fName}
                        </span>
                        <span className="block text-xs text-indigo-500 font-mono">
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  ))}


            </div>
          </aside>

          <main className="flex-1 p-6 flex flex-col justify-between relative">
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                <MessageSquareMore className="w-5 h-5 text-purple-600" />
                Chat with <span className="text-indigo-600">{selectedReceiver || "..."}</span>
              </h1>

              <div className="h-[22rem] overflow-y-auto rounded-lg bg-gray-50 p-4 border shadow-inner space-y-4">
                {isChatLoading ? (
                  <p className="text-center text-gray-400 italic">Loading chat...</p>
                ) : (

                  chat.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.from === username ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`px-4 py-2 rounded-xl max-w-xs text-sm shadow-sm ${msg.from === username
                            ? "bg-green-200 text-gray-900"
                            : "bg-white text-gray-900 border"
                          }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">
                          {msg.from === username ? "You" : msg.from}
                        </p>
                        <div className="flex justify-between items-center gap-2">
                          <p className="break-words">{msg.message}</p>
                          {msg.created_at && (
                            <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  )))

                }
                {isTyping?.isTyping && (
                  <p className="text-sm italic text-gray-400">{isTyping.typer} is typing...</p>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {showEmojiPicker && (
              <div className="absolute bottom-24 right-6 bg-white border border-gray-300 rounded-xl shadow-lg p-3 grid grid-cols-6 gap-2 z-50">
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

            <div className="mt-4 flex items-center gap-2 relative">
              <input
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Type a message..."
                value={message}
                onChange={handleTyping}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className="text-xl px-2 hover:scale-110 transition-transform"
                title="Insert Emoji"
              >
                <Smile className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!message.trim() || !selectedReceiver}
                className={`flex items-center gap-1 px-5 py-2 rounded-lg text-white transition ${message.trim() && selectedReceiver
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
