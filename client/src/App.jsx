import React, { useEffect, useState ,useRef} from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");
// const socket = io("https://chatterssocket-production.up.railway.app/");

export default function ChatApp() {
  const [username, setUsername] = useState(localStorage.getItem("chat_user") || "");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const chatEndRef = useRef(null);
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [chat]);


  useEffect(() => {
    if (username) {
      socket.emit("username", { username });

      socket.on("chat message", (msg) => {
        setChat((prev) => [...prev, msg]);
      });

      socket.on("private message", (msg) => {
        setChat((prev) => [...prev, msg]);
      });

      socket.on("typing", (status) => {
        setIsTyping({message:status.message,
                     typer:status.typer,
                     isTyping: status.isTyping
                    
        });
      });

      socket.on("online users", (users) => {
        setOnlineUsers(users);
      });
    }

    return () => {
      socket.off();
    };
  }, [username]);

  const handleLogin = (input) => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed.length > 0) {
      setUsername(trimmed);
      localStorage.setItem("chat_user", trimmed);
      socket.emit("username", { username: trimmed });
    } else {
      alert("❌ Please enter a username");
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedReceiver) {
      alert("❌ Please select a user and write a message");
      return;
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
      receiver:selectedReceiver        // or send username instead if you prefer
    });
  };

  const typingTimeoutRef = useRef(null);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Emit isTyping: true immediately
    socket.emit("typing", {
      isTyping: true,
      sender: username,
      receiver: selectedReceiver,
    });

    // Clear previous timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timer: if no typing happens for 800ms, emit isTyping: false
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
    setChat([]);
    setOnlineUsers([]);
    setSelectedReceiver("");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {!username ? (
        <div className="bg-white shadow p-6 rounded-xl w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4">Join Chat 👤</h2>
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
            placeholder="Enter your name"
            onKeyDown={(e) => e.key === "Enter" && handleLogin(e.target.value)}
          />
          <button
            onClick={(e) =>
              handleLogin(e.target.previousElementSibling?.value || "")
            }
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full"
          >
            Join
          </button>
        </div>
      ) : (
        <div className="w-full max-w-lg bg-white shadow-lg rounded-xl p-6">
          {/* New heading showing username */}
          <h1 className="text-2xl font-bold mb-4">Welcome, {username}</h1>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Private Chat 💬</h2>
            <button
              onClick={logout}
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>

          <div className="text-sm mb-3 text-gray-600">
            <strong>🟢 Online:</strong>{" "}
            {onlineUsers.length > 0 ? (
              <select
                value={selectedReceiver}
                onChange={(e) => setSelectedReceiver(e.target.value)}
                className="border rounded px-2 py-1 ml-2"
              >
                <option value="">Select user</option>
                {onlineUsers
                  .filter((user) => user !== username)
                  .map((user, idx) => (
                    <option key={idx} value={user}>
                      {user}
                    </option>
                  ))}
              </select>
            ) : (
              "No one"
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4 h-64 overflow-y-auto bg-gray-50 mb-4">
            {chat.map((msg, idx) => (
              <div key={idx} className="mb-2">
                <span className="font-semibold text-blue-600">{msg.from}:</span>{" "}
                <span>{msg.message}</span>
              </div>
            ))}
              {isTyping?.message && isTyping.isTyping === true && isTyping?.typer && (
                <div className="text-gray-400 italic">{`${isTyping.typer} is ${isTyping.message}...`}</div>
              )}
              <div ref={chatEndRef}
                className=" rounded-lg p-4 h-12 overflow-y-auto bg-gray-50 mb-4"

              /> {/* 👈 This makes it auto-scroll */}

                  </div>

          <div className="flex items-center space-x-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
