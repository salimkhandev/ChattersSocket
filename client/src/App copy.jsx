


import { Phone, Video, WifiOff } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";
import ForgetPassword from './Components/Auth/ForgetPassword';
import LoginForm from "./Components/Auth/LoginForm";
import LogoutButton from "./Components/Auth/LogoutButton";
import ResetPassword from './Components/Auth/ResetPassword';
import SignupForm from "./Components/Auth/SignupForm";
import CallRingtone from './Components/Call/CallRingtone';
import CallUIPlaceholder from './Components/Call/CallUIPlaceholder';
import OutGoingAudioCall from './Components/Call/OutGoingAudioCall';
import OutGoingVideoCall from './Components/Call/OutGoingVideoCall';
import VideoCall from './Components/Call/VideoCall';
import { generateToken } from './Components/FCM/firebase'; // adjust the path
import GroupChat from "./Components/GroupChat/GroupChat";
import ChatMessages from './Components/PrivateChat/ChatMessages';
import ChatPeersList from './Components/PrivateChat/ChatPeers/ChatPeersList';
import MessageInput from "./Components/PrivateChat/MessageInput";
import OnlineUserList from './Components/PrivateChat/OnlineUserList';
import ToggleTabs from "./Components/PrivateChat/ToggleTabs";
import UserProfileUpload from "./Components/PrivateChat/UserProfile";
import InstallPWAButton from './Components/PWA/InstallPWAButton';
import { useAuth } from "./context/AuthContext";
import { useCall } from "./context/CallContext";
// import AudioCallDisplay from './Components/Call/AudioCallDisplay';
import AuthLoader from './Components/Auth/AuthLoader';
import VideoDisplay from './Components/Call/VideoDisplay';
// import { Routes, Route } from 'react-router-dom';
import SidebarToggle from './Components/PrivateChat/SideBarToggle';
import { useBlock } from "./context/BlockedCallContext";
import { useMedia } from './context/MediaContext';

// In your JSX, replace the current <aside> section with:

// import SignupForm from './Components/Auth/SignupForm';

const backendURL = import.meta.env.VITE_BACKEND_URL;

import {
  MessageSquareMore,
  X
} from "lucide-react";




const socket = io(`${backendURL}`, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  withCredentials: true,  // ✅ required for cookies
});



export default function ChatApp() {
  const { chat, setChat } = useMedia();
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);  // track when name is ready
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu toggle
  const { callAccepted, setShowVideo, showVideo, callerFullname, callerUsername, outGoingCall, timerRef, cleanupMedia, setCallReceiverFullname2 // ✔️ correct
    , setOutGoingCall, callStartRef, rejectCall, isAudioCall, remoteVideoRef2, currentIsVideo, setCurrentIsVideo, localVideoRef2, localVideoRefForOutgoing, callerProfilePic,
    setCallTime,
    setIsConnected } = useCall();
  const [selectedReceiverFullname, setSelectedReceiverFullname] = useState("");
  const [message, setMessage] = useState("");
  const [pendingMessages, setPendingMessages] = useState([]); // {id, to, message, created_at}
  // const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatPeers, setChatPeers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [isChattingWindowOpen, setIsChattingWindowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("people"); // or "groups"
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { username, setUsername, setSocket, isLoggedIn, setIsLoggedIn, checkingAuth } = useAuth();
  const webrtcRef = useRef(null);
  // const webrtcRef2 = useRef(null);
  const { blockCaller } = useBlock();

  const [page, setPage] = useState("login"); // or "forget-password"

  // Add new state
  const [selectedReceiverProfilePic, setSelectedReceiverProfilePic] = useState("");


  useEffect(() => {
    if (!socket) return;
    setSocket(socket);

    socket.on("call-started", () => {
      setIsConnected(true); // timer starts
    });

    return () => {
      socket.off("call-started");
    };
  }, [socket]);



  const performCallCleanup = (callID) => {

    rejectCall(); // hide outgoing call component
    blockCaller(callID);
    setShowVideo(false);
    cleanupMedia();
    // alert("Call ended");
    timerRef.current = null;
    callStartRef.current = null;
    setCallTime(0);
    setOutGoingCall(false);
    setIsConnected(false);
    setCallReceiverFullname2(null);  // ✔️ correct

  };




  useEffect(() => {
    if (selectedReceiver) {
      const foundUser = onlineUsers.find(u => u.username === selectedReceiver);
      setSelectedReceiverFullname(foundUser?.fName || selectedReceiver);
      setSelectedReceiverProfilePic(foundUser?.profilePic || ""); // ✅ store profile pic
    } else {
      setSelectedReceiverFullname("");
      setSelectedReceiverProfilePic(""); // reset if no receiver
    }
  }, [selectedReceiver, onlineUsers, localVideoRef2]);

  useEffect(() => {
    if (selectedReceiver) {
      const foundUser = chatPeers.find(u => u.username === selectedReceiver);
      setSelectedReceiverFullname(foundUser?.fName || selectedReceiver);
      setSelectedReceiverProfilePic(foundUser?.profilePic || ""); // ✅ store profile pic
    } else {
      setSelectedReceiverFullname("");
      setSelectedReceiverProfilePic(""); // reset if no receiver
    }
  }, [selectedReceiver, chatPeers, localVideoRef2]);


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
    if (!socket) return;

    // When call is rejected
    const handleCallRejected = ({ rejectedByFullname, callID }) => {
      if (rejectedByFullname != 'you') {
        console.log(`${rejectedByFullname} rejected your call`);
        toast.error(`${rejectedByFullname} rejected your call 😢`);
      }
      performCallCleanup(callID);

    };

    // When call is accepted
    const handleCallAccepted = ({ acceptedByFullname }) => {
      console.log(`${acceptedByFullname} accepted your call`);
      toast.success(`${acceptedByFullname} accepted your call 🎉`);
      setShowVideo(true); // show video component
      setOutGoingCall(false); // hide outgoing call 
      // setVideoDisplay(true)



    };

    socket.on("call-rejected", handleCallRejected);
    socket.on("call-accepted", handleCallAccepted);

    return () => {
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-accepted", handleCallAccepted);
    };
  }, [socket, setShowVideo, outGoingCall]);



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
        console.log('this is the seen message 😡❤️😂🟢❌😒🦞');

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
    socket.connect();
    if (username) {
      socket.emit("username", { username });



      socket.on("chat message", (msg) => {
        // Clear matching pending message if it's ours
        if (msg.from === username) {
          setPendingMessages((prev) => {
            // try to match by to + message text; if not found, drop oldest
            const idx = prev.findIndex(p => p.to === msg.to && p.message === msg.message);
            if (idx === -1) {
              // take elmnts from index one till the end
              return prev.slice(1);
            }
            const next = [...prev];
            // start at index one and remove one element ie that element
            next.splice(idx, 1);
            return next;
          });
        }
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
      socket.on("chatPeers", setChatPeers);

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
        type: msg.type,
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
    // socket.on("online users", setOnlineUsers);

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
    // set pending before emit
    const tempId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const pending = {
      id: tempId,
      to: selectedReceiver,
      message: message.trim(),
      created_at: new Date().toISOString(),
    };
    setPendingMessages((prev) => [...prev, pending]);
    socket.emit('username', { username })
    socket.emit("chat messages", {
      sender: username,
      receiver: selectedReceiver,
      message: message.trim(),
      clientTempId: tempId,
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

  const logout = async () => {
    try {
      // Call backend to clear cookie
      await fetch(`${backendURL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      // Local cleanup
      localStorage.removeItem("chat_user");
      setUsername("");
      setIsLoggedIn(false);
      setChat([]);
      setOnlineUsers([]);
      setChatPeers([]);
      setSelectedReceiver("");
      socket.disconnect();

    } catch (err) {
      console.error("Logout failed:", err);
    }
  };


  const closeChat = () => {
    // clear the pendingmessages
    setPendingMessages([]);
    setSelectedReceiver("");
    setChat([]);
    // setShowEmojiPicker(false);
    setIsChattingWindowOpen(false);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleDisconnect = ({ disconnected_username }) => {
      // Show toast notification


      // Close chat if the disconnected user is the selected receiver
      if (disconnected_username === selectedReceiver) {
        closeChat();
        toast(`${disconnected_username} went offline`, {
          icon: <WifiOff className="w-5 h-5 text-white" />,
          style: {
            background: "#333",
            color: "#fff",
          },
          duration: 3000,
        });
      }
    };

    socket.on("disconnected-user", handleDisconnect);

    return () => {
      socket.off("disconnected-user", handleDisconnect);
    };
  }, [selectedReceiver]);




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

  // const refreshOnlineUsers = () => {
  //   if (socket) {
  //     socket.emit("username", { username });
  //     // sendUsernameEvent();
  //     socket.connect();

  //   }

  // };
  const goLogin = () => window.location.href = "/";

  // Get current path
  const path = window.location.pathname;

  // Check if URL matches /reset-password/:token
  if (path.startsWith("/reset-password/")) {
    const token = path.split("/").pop();
    return <ResetPassword token={token} goLogin={goLogin} />;
  }


  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      <Toaster position="top-right" reverseOrder={false} />
      <AuthLoader socket={socket} />
      {checkingAuth && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <img
            src="/icons/loading.gif"
            alt="Loading..."
            className="w-20 h-20 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain"
          />
        </div>

      )}

      {(!username || !isLoggedIn) && !checkingAuth ? (
        <div className="h-full w-full flex items-center justify-center p-4">
          {page === "login" && <LoginForm forgetPassword={() => setPage("forget-password")} signup={() => setPage("signup")} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} socket={socket} />}
          {page === "forget-password" && <ForgetPassword goLogin={() => setPage("login")} socket={socket} />}
          {page === "signup" && <SignupForm isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} LoginForm={() => setPage("login")} socket={socket} />}
        </div>

      ) : (

        <div className="h-full w-full bg-white flex flex-col overflow-hidden">
          <CallUIPlaceholder socket={socket} username={username} />
          <CallRingtone />
          {outGoingCall && currentIsVideo && <OutGoingVideoCall performCallCleanup={performCallCleanup} socket={socket} cleanupMedia={webrtcRef.current.cleanupMedia} username={username} selectedReceiverProfilePic={selectedReceiverProfilePic} calleeFullname={selectedReceiverFullname} />}
          {outGoingCall && !currentIsVideo && <OutGoingAudioCall performCallCleanup={performCallCleanup} socket={socket} cleanupMedia={webrtcRef.current.cleanupMedia} username={username} selectedReceiverProfilePic={selectedReceiverProfilePic} calleeFullname={selectedReceiverFullname} />}
          {(callAccepted || showVideo) && <VideoDisplay performCallCleanup={performCallCleanup} callerUsername={callerUsername} currentIsVideo={currentIsVideo} profilePic={selectedReceiverProfilePic} callerProfilePic={callerProfilePic} callerName={callerFullname} socket={socket} username={username} localRef={localVideoRef2} remoteRef={remoteVideoRef2} />}


          {/* Top Navigation Bar */}
          <div className="bg-white border-b p-3 sm:p-4 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}


              <UserProfileUpload nameLoaded={nameLoaded} username={username} socket={socket} />
            </div>

            <div className="hidden sm:block">
              <ToggleTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <InstallPWAButton />
            </div>

            <LogoutButton logout={logout} />
          </div>

          {/* Mobile tabs - only shown on small screens */}
          <div className="sm:hidden bg-white border-b">
            <ToggleTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <InstallPWAButton />
          </div>

          <div className="flex-1 relative overflow-hidden">
            {/* People Tab */}
            <div className={`absolute inset-0 w-full h-full transition-all duration-300 ease-in-out transform ${activeTab === "people"
              ? "translate-x-0 opacity-100 z-10"
              : "-translate-x-full opacity-0 pointer-events-none z-0"
              }`}>

              <VideoCall ref={webrtcRef} receiver={selectedReceiver} socket={socket} />
              {(callAccepted || showVideo) ? null :
                <>
                  <div className="w-full h-full flex">
                    {/* Sidebar - Hidden on mobile when chat is open, except when mobile menu is open */}
                    <SidebarToggle
                      chatPeers={chatPeers}
                      onlineUsers={onlineUsers}
                      selectedReceiver={selectedReceiver}
                      setSelectedReceiver={setSelectedReceiver}
                      setIsChattingWindowOpen={setIsChattingWindowOpen}
                      setIsChatLoading={setIsChatLoading}
                      getMessagesHistory={getMessagesHistory}
                      isTyping={isTyping}
                      isChattingWindowOpen={isChattingWindowOpen}
                      isMobileMenuOpen={isMobileMenuOpen}
                      setIsMobileMenuOpen={setIsMobileMenuOpen}
                      ChatPeersList={ChatPeersList}

                      OnlineUserList={OnlineUserList}
                    />

                    {/* Main Chat Area */}
                    {selectedReceiver && (
                      <main className={`
                        ${isMobileMenuOpen ? 'hidden lg:flex' : 'flex'}
                        flex-1 flex-col w-full lg:w-auto
                      `}>
                        <div className="flex flex-col h-full">
                          {/* Chat Header */}
                          <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white">
                            <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                              <span className="text-indigo-600">
                                {onlineUsers.find(u => u.username === selectedReceiver)?.fName || selectedReceiverFullname}
                              </span>
                            </h1>

                            {/* Call buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (webrtcRef.current) {
                                    webrtcRef.current.createOffer(true);
                                    setShowVideo(true);
                                    setOutGoingCall(true)
                                  } else {
                                    console.warn("WebRTC component not ready yet");
                                  }
                                }}
                                className="
                                 relative group
                                 w-10 h-10 sm:w-12 sm:h-12
                                 rounded-full
                                 bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500
                                 shadow-xl shadow-blue-500/30
                                 flex items-center justify-center
                                 focus:outline-none focus:ring-4 focus:ring-blue-400/30
                                 transition-all duration-200 hover:scale-105
                                              "
                              >
                                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                              </button>
                              <button
                                onClick={() => {
                                  if (webrtcRef.current) {
                                    webrtcRef.current.createOffer(false);
                                    setShowVideo(true);
                                    setOutGoingCall(true)
                                  } else {
                                    console.warn("WebRTC component not ready yet");
                                  }
                                }}
                                className="
                                 relative group
                                 w-10 h-10 sm:w-12 sm:h-12
                                 rounded-full
                                 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500
                                 shadow-xl shadow-green-500/30
                                 flex items-center justify-center
                                 focus:outline-none focus:ring-4 focus:ring-green-400/30
                                 transition-all duration-200 hover:scale-105
                                              "
                              >
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                              </button>

                              <button
                                onClick={closeChat}
                                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors ml-2"
                                title="Close chat"
                              >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Messages Area */}
                          <div className="flex-1 overflow-y-auto bg-gray-50 p-3 sm:p-4 space-y-4">
                            <ChatMessages
                              isChatLoading={isChatLoading}
                              chat={chat}
                              socket={socket}
                              setChat={setChat}
                              pendingMessages={pendingMessages}
                            />

                            {isTyping.typer === selectedReceiver && (
                              <p className="text-sm italic text-gray-400">{isTyping.typer} is typing...</p>
                            )}
                            <div className="pb-8" ref={chatEndRef} />
                          </div>

                          {/* Message Input */}
                          {/* <div > */}
                          <MessageInput
                            message={message}
                            setMessage={setMessage}
                            sendMessage={sendMessage}
                            handleTyping={handleTyping}
                            selectedReceiver={selectedReceiver}
                            sender={username}
                            socket={socket}
                          />
                          {/* </div> */}
                        </div>
                      </main>
                    )}

                    {/* Empty state when no chat selected - only show on desktop */}
                    {!selectedReceiver && (
                      <main className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <MessageSquareMore className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a conversation</h3>
                          <p className="text-gray-500">Choose a user from the sidebar to start chatting</p>
                        </div>
                      </main>
                    )}
                  </div>
                </>
              }
            </div>

            {/* Groups Tab */}
            <div className={`absolute inset-0 w-full h-full flex transition-all duration-300 ease-in-out transform ${activeTab === "groups"
              ? "translate-x-0 opacity-100 z-10"
              : "translate-x-full opacity-0 pointer-events-none z-0"
              }`}>
              <GroupChat socket={socket} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}