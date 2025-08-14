import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import LoginForm from "./Components/Auth/LoginForm";
import GroupChat from "./Components/GroupChat/GroupChat";
import ChatMessages from './Components/PrivateChat/ChatMessages';
import MessageInput from "./Components/PrivateChat/MessageInput";
import OnlineUserList from './Components/PrivateChat/OnlineUserList';
import ToggleTabs from "./Components/PrivateChat/ToggleTabs";
import { useAuth } from "./context/AuthContext";
import { generateToken } from './Components/FCM/firebase'; // adjust the path
import OutgoingCallModal from './Components/Call/OutgoingCallModal';
import VideoCall from './Components/Call/VideoCall';


import UserProfileUpload from "./Components/PrivateChat/UserProfile";
// import profilePic from './Components/image.png';
import { io } from "socket.io-client";


import {
  LogOut,
  MessageSquareMore,
  Users,
  X
} from "lucide-react";

// const socket = io("http://192.168.137.1:3000");

// const socket = io("https://5dbb6c84-cb5e-4423-ba04-72e6a621809a-00-7sp7cj9ozrz2.spock.replit.dev/", {
//   reconnection: true,
//   reconnectionAttempts: Infinity,
//   reconnectionDelay: 2000,
// });

const socket = io("http://192.168.137.1:3000", {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
});
// const socket = io("https://6f5c0ecc-d764-4d9b-99d7-ed5849f753b0-00-3qdthpdkcdg9n.worf.replit.dev");


export default function ChatApp() {
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);  // track when name is ready

  // const [username, setUsername] = useState(localStorage.getItem("chat_user") || "");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [isChattingWindowOpen, setIsChattingWindowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("people"); // or "groups"
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevChatRef = useRef([]);
  const { username, setUsername } = useAuth();

  // const getSenderFullname = (username) => {
  //   const found = chat.find((msg) => msg.from === username);
  //   return found ? found.senderfullname : username;
  // };


  // useEffect(() => {

  //   console.log({chat});

  //   console.log('the fullname is ',getSenderFullname(username)); 

  // }, [selectedReceiver,chat]);

  useEffect(() => {
    const getToken = async () => {
      const token = await generateToken();
      if (token) {
        localStorage.setItem("token", token);
        // setFcm_token(token);
      }
    };
    getToken();
  }, []);



  useEffect(() => {
    const prev = prevChatRef.current;
    const isSame =
      prev.length === chat.length &&
      prev.every((msg, i) => msg.message === chat[i]?.message && msg.created_at === chat[i]?.created_at);

    if (!isSame && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    prevChatRef.current = chat;
  }, [chat]);

  // useEffect(() => {

  //   if (!username || !selectedReceiver) return;

  //   const markSeen = () => {
  //     if (document.visibilityState === "visible") {
  //       socket.emit("mark messages seen", {
  //         sender: selectedReceiver,
  //         receiver: username,
  //       });
  //     }
  //   };



  //   const interval = setInterval(markSeen, 2000);
  //   document.addEventListener("visibilitychange", markSeen);

  //   markSeen();

  //   return () => {
  //     clearInterval(interval);
  //     document.removeEventListener("visibilitychange", markSeen);
  //   };
  // }, [selectedReceiver, username]);


  useEffect(() => {
    if (!username || !selectedReceiver || !chat) return;


    const markSeen = () => {
      const unseenMessages = chat.filter(
        (msg) =>
          msg.from === selectedReceiver &&
          !msg.seen
      );
      // console.log('Hello');


      if (
        unseenMessages.length > 0 &&
        document.visibilityState === "visible"
      ) {
        console.log('tHis is the seen message😡❤️😂🟢❌😒🦞');

        socket.emit("mark messages seen", {
          sender: selectedReceiver,
          receiver: username,
        });
      }
    };

    const interval = setInterval(markSeen, 2000);
    document.addEventListener("visibilitychange", markSeen);

    markSeen();

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", markSeen);
    };
  }, [selectedReceiver, username, chat]);


  const getMessagesHistory = ({ sender, receiver }) => {
    socket.emit("get chat history", {
      sender,
      receiver,
    });
  };

  useEffect(() => {

    const handleTyping = (status) => {

      if (status.isTyping) {
        setIsTyping(status);
      } else {
        setIsTyping({ isTyping: false });
      }
    };

    socket.on("typing", handleTyping);

    return () => {
    };
  }, [selectedReceiver]);
  const sendUsernameEvent = () => {
    if (username) {
      socket.emit("username", { username });



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

        const messageWasEdited =
          msg.updated_at && (!existing?.updated_at || msg.updated_at !== existing.updated_at);

        const seenAtChanged =
          msg.seen_at && (!existing?.seen_at || msg.seen_at !== existing.seen_at);

        const deletedForEveryoneChanged =
          msg.is_deleted_for_everyone && !existing?.is_deleted_for_everyone;

        if (
          !existing ||
          msgTime > existingTime ||
          seenAtChanged ||
          deletedForEveryoneChanged ||
          messageWasEdited
        ) {
          mergedMap.set(msg.id, msg);
        }
      });

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    };



    // ✅ Handle login response
    // const handleLogin = ({ success, message }) => {
    //   setIsLoggedIn(success);
    //   setError(success ? "" : message);
    // };

    // ✅ Handle chat history response
    const handleChatHistory = (messagesFromDB) => {
      const formattedMessages = messagesFromDB.map((msg) => ({
        from: msg.sender,
        to: msg.receiver,
        senderfullname: msg.senderfullname,
        sender_profile_pic: msg.sender_profile_pic,
        message: msg.message,
        created_at: msg.created_at,
        audio_url: msg.audio_url,
        is_voice: msg.is_voice,
        media_url: msg.media_url,
        format: msg.format,
        seen: msg.seen,
        seen_at: msg.seen_at,
        updated_at: msg.updated_at,
        updated: msg.updated,
        id: msg.id,
        deleted_for: msg.deleted_for,
        is_deleted_for_everyone: msg.is_deleted_for_everyone,
      }));


      setChat((prevMessages) => {

        return mergeAndDeduplicate(prevMessages, formattedMessages);

      });

      setIsChatLoading(false);
    };


    // 🔌 Register listeners
    // socket.on("isLoggedIn", handleLogin);
    socket.on("chat history", handleChatHistory);

    // Send username event to server
    sendUsernameEvent();



    // 🔁 Cleanup listeners on unmount or dependency change
    return () => {
      // socket.off("isLoggedIn", handleLogin);
      socket.off("chat history", handleChatHistory);
    };
  }, [username, selectedReceiver]);


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
    }, 1000);
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

  const closeChat = () => {
    setSelectedReceiver("");
    setChat([]);
    // setShowEmojiPicker(false);
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
        <LoginForm isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      ) : (


        <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden h-[calc(100vh-2rem)]">
          {/* Top Navigation Bar */}
          <div className="bg-white border-b p-4 flex items-center justify-between shrink-0 z-20">
            <UserProfileUpload nameLoaded={nameLoaded} username={username} socket={socket} />
            <ToggleTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <button
              onClick={logout}
              className="text-red-500 hover:text-red-600 text-sm flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {/* People Tab */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out transform ${activeTab === "people"
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

                  </div>
                  <div className="flex-1 overflow-y-auto mt-2 space-y-2">
                    <OnlineUserList
                      onlineUsers={onlineUsers}
                      selectedReceiver={selectedReceiver}
                      setSelectedReceiver={setSelectedReceiver}
                      setIsChattingWindowOpen={setIsChattingWindowOpen}
                      setIsChatLoading={setIsChatLoading}
                      getMessagesHistory={getMessagesHistory}
                      isTyping={isTyping}
                      isChattingWindowOpen={isChattingWindowOpen}
                    />
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
                          <VideoCall receiver={selectedReceiver} socket={socket} />
                         

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

                        <ChatMessages
                          isChatLoading={isChatLoading}
                          chat={chat}
                          socket={socket}
                          setChat={setChat}
                        />

                        {isTyping.typer === selectedReceiver && (
                          <p className="text-sm italic text-gray-400">{isTyping.typer} is typing...</p>
                        )}
                        <div className="pb-8" ref={chatEndRef} />
                      </div>
                      <MessageInput
                        message={message}
                        setMessage={setMessage}
                        sendMessage={sendMessage}
                        handleTyping={handleTyping}
                        selectedReceiver={selectedReceiver}
                        sender={username}                // ✅ Added
                        socket={socket}
                      />

                    </div>
                  </main>
                )}
              </div>
            </div>

            {/* Groups Tab */}
            <div className={`absolute inset-0 w-full h-full flex transition-all duration-300 ease-in-out transform ${activeTab === "groups"
              ? "translate-x-0 opacity-100 z-10"
              : "translate-x-full opacity-0 pointer-events-none z-0"
              }`}>
              {/* <GroupChat socket={socket} senderFullName={(user)=>chat.find(user.username=username then return the full name of the username)} username={username} /> */}
              <GroupChat
                socket={socket}
              // getSenderFullname={getSenderFullname}

              />

            </div>
          </div>
        </div>
      )}
    </div>
  );
}