import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const socket = io("https://chatterssocket-production.up.railway.app");

const ChatComponent = () => {
  const [message, setMessage] = useState("Hell from frontend");
  const [messages, setMessages] = useState([]);
  const [name, setName]= useState("");
  const typingTimeoutRef = useRef(null);


  useEffect(() => {
  
    socket.on("chat message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      console.log(msg);
      
    },


         socket.on('typing', (name) => {
           setName(name)
           clearTimeout(typingTimeoutRef.current);
           typingTimeoutRef.current = setTimeout(() => {
             setName("")
           }, 1000);

         })



  );
    

    return () => socket.off("chat message");
  }, []);

  const setMessageAndTyping = (e) => {
    setMessage(e.target.value);
    
  
 
      socket.emit('typing',"Salim");
   

  }


  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chat messages", message);
      // setMessage("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h1 className="text-3xl font-bold text-center text-blue-600">💬 Chat App</h1>
        <div className="flex items-center justify-between">
          {name? (<div>
            <p className="text-gray-500">{name} is typing...</p>
          </div>) : (<div>
            no one is typing
          </div>)}
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50 shadow-inner">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="bg-blue-100 text-blue-900 px-3 py-1 rounded-xl text-sm break-words"
            >
              {msg}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={setMessageAndTyping}
            className="flex-1 px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
