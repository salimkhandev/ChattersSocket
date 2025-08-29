import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import LoginForm from "./Components/Auth/LoginForm";
import SignupForm from "./Components/Auth/SignupForm";
import LogoutButton from "./Components/Auth/LogoutButton";
import GroupChat from "./Components/GroupChat/GroupChat";
import ChatMessages from './Components/PrivateChat/ChatMessages';
import InstallPWAButton from './Components/PWA/InstallPWAButton';
import MessageInput from "./Components/PrivateChat/MessageInput";
import OnlineUserList from './Components/PrivateChat/OnlineUserList';
import ToggleTabs from "./Components/PrivateChat/ToggleTabs";
import { useAuth } from "./context/AuthContext";
import { generateToken } from './Components/FCM/firebase'; // adjust the path
import CallUIPlaceholder from './Components/Call/CallUIPlaceholder';
import OutGoingVideoCall from './Components/Call/OutGoingVideoCall';
import OutGoingAudioCall from './Components/Call/OutGoingAudioCall';
import ForgetPassword from './Components/Auth/ForgetPassword';
import ResetPassword from './Components/Auth/ResetPassword';
import VideoCall from './Components/Call/VideoCall';
import CallRingtone from './Components/Call/CallRingtone';
import UserProfileUpload from "./Components/PrivateChat/UserProfile";
import { useCall } from "./context/CallContext";
import { io } from "socket.io-client";
import { Video, Phone, Menu, ArrowLeft, WifiOff } from "lucide-react";
// import AudioCallDisplay from './Components/Call/AudioCallDisplay';
import VideoDisplay from './Components/Call/VideoDisplay';
import AuthLoader from './Components/Auth/AuthLoader';
// import { Routes, Route } from 'react-router-dom';
import { useBlock } from "./context/BlockedCallContext";

// import SignupForm from './Components/Auth/SignupForm';

const backendURL = import.meta.env.VITE_BACKEND_URL;

import {
  LogOut,
  MessageSquareMore,
  Users,
  X
} from "lucide-react";




const socket = io(`${backendURL}`, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  withCredentials: true,  // ✅ required for cookies
});



export default function ChatApp() {
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);  // track when name is ready
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu toggle
  const { callAccepted, setShowVideo, showVideo, callerFullname, callerUsername, outGoingCall, timerRef, cleanupMedia, setCallReceiverFullname2 // ✔️ correct
, setOutGoingCall, callStartRef, rejectCall, isAudioCall, remoteVideoRef2, currentIsVideo, setCurrentIsVideo, localVideoRef2, localVideoRefForOutgoing, callerProfilePic,
    setCallTime,
    setIsConnected } = useCall();
  const [selectedReceiverFullname, setSelectedReceiverFullname] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [isChattingWindowOpen, setIsChattingWindowOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("people"); // or "groups"
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const prevChatRef = useRef([]);
  const { username, setUsername, isLoggedIn, setIsLoggedIn,checkingAuth } = useAuth();
  const webrtcRef = useRef(null);
  // const webrtcRef2 = useRef(null);
  const { blockCaller } = useBlock();

  const [page, setPage] = useState("login"); // or "forget-password"
  
  // Add new state
  const [selectedReceiverProfilePic, setSelectedReceiverProfilePic] = useState("");

  
  useEffect(() => {
    if (!socket) return;

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
    const getToken = async () => {
      const token = await generateToken();
      if (token) {
        localStorage.setItem("token", token);
        // setFcm_token(token);
      }
    };
    getToken();
  }, []);



  // useEffect(() => {
  //   const prev = prevChatRef.current;
  //   const isSame =
  //     prev.length === chat.length &&
  //     prev.every((msg, i) => msg.message === chat[i]?.message && msg.created_at === chat[i]?.created_at);

  //   if (!isSame && chatEndRef.current) {
  //     chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  //   }

  //   prevChatRef.current = chat;
  // }, [chat]);

  useEffect(() => {
    if (!socket) return;

    // When call is rejected
    const handleCallRejected = ({ rejectedByFullname,callID }) => {
    if (rejectedByFullname != 'you') {  console.log(`${rejectedByFullname} rejected your call`);
      toast.error(`${rejectedByFullname} rejected your call 😢`);}
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
  }, [socket, setShowVideo,outGoingCall]);



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
      setSelectedReceiver("");
      socket.disconnect();

    } catch (err) {
      console.error("Logout failed:", err);
    }
  };


  const closeChat = () => {
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
      <AuthLoader socket={socket}/>
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
          {page === "login" && <LoginForm forgetPassword={() => setPage("forget-password")} signup={() => setPage("signup")} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} socket={socket} /> }
          {page === "forget-password" && <ForgetPassword goLogin={() => setPage("login")} socket={socket} /> }
          {page === "signup" && <SignupForm isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} LoginForm={()=>setPage("login")} socket={socket} /> }
        </div>
        
      ) : (

        <div className="h-full w-full bg-white flex flex-col overflow-hidden">
            <CallUIPlaceholder socket={socket} username={username} />
            <CallRingtone/>
            {outGoingCall && currentIsVideo && <OutGoingVideoCall performCallCleanup={performCallCleanup}  socket={socket} cleanupMedia={webrtcRef.current.cleanupMedia}  username={username} selectedReceiverProfilePic={selectedReceiverProfilePic} calleeFullname={selectedReceiverFullname} />}
            {outGoingCall && !currentIsVideo && <OutGoingAudioCall performCallCleanup={performCallCleanup} socket={socket} cleanupMedia={webrtcRef.current.cleanupMedia}  username={username} selectedReceiverProfilePic={selectedReceiverProfilePic} calleeFullname={selectedReceiverFullname} />}
            {(callAccepted || showVideo) && <VideoDisplay performCallCleanup={performCallCleanup} callerUsername={callerUsername} currentIsVideo={currentIsVideo} profilePic={selectedReceiverProfilePic} callerProfilePic={callerProfilePic} callerName={callerFullname} socket={socket} username={username} localRef={localVideoRef2} remoteRef={remoteVideoRef2}  />}


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
         
            <LogoutButton logout={logout}/>
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
                    <aside className={`
                      ${selectedReceiver && !isMobileMenuOpen ? 'hidden lg:flex' : 'flex'} 
                      w-full lg:w-80 bg-white border-r flex-col
                      ${isMobileMenuOpen && selectedReceiver ? 'absolute inset-0 z-30 bg-white' : ''}
                    `}>
                      <div className="p-4 sm:p-5 border-b">
                        <div className="flex justify-between items-center">
                          <h2 className="text-lg font-semibold text-indigo-600 flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Online Users
                          </h2>
                          {/* Close button for mobile menu */}
                          {isMobileMenuOpen && selectedReceiver && (
                            <button
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
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
                                {onlineUsers.find(u => u.username === selectedReceiver)?.fName || selectedReceiver}
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