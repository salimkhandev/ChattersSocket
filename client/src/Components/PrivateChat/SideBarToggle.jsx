import { MessageSquare, Users, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SidebarToggle = ({
    chatPeers,
    onlineUsers,
    selectedReceiver,
    setSelectedReceiver,
    setIsChattingWindowOpen,
    setIsChatLoading,
    getMessagesHistory,
    isTyping,
    isChattingWindowOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    ChatPeersList,
    OnlineUserList
}) => {
    const [activeView, setActiveView] = useState('chats'); // 'chats' or 'online'
    const { username, setId } = useAuth();
    const myId = (onlineUsers || []).find((u) => u.username === username);
    
    // Update user ID in AuthProvider after render
    useEffect(() => {
        if (myId?.id) {
            setId(myId.id);
        }
    }, [myId?.id, setId]); 
    return (
        <aside className={`
      ${selectedReceiver && !isMobileMenuOpen ? 'hidden lg:flex' : 'flex'} 
      w-full lg:w-80 bg-white border-r flex-col
      ${isMobileMenuOpen && selectedReceiver ? 'absolute inset-0 z-30 bg-white' : ''}
    `}>
            {/* Header with Toggle */}
            <div className="p-4 sm:p-5 border-b">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative bg-gray-100 rounded-lg p-1 flex">
                            {/* Chats Tab */}
                            <button
                                onClick={() => setActiveView('chats')}
                                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-200 ease-in-out
                  ${activeView === 'chats'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'}`}>
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline">Chats</span>
                              
                            </button>

                            {/* Online Tab */}
                            <button
                                onClick={() => setActiveView('online')}
                                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                  transition-all duration-200 ease-in-out
                  ${activeView === 'online'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-800'}`}>
                                <div className="relative">
                                    <Users className="w-4 h-4" />
                                    {(onlineUsers || []).length-1 > 0 && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                </div>
                                <span className="hidden sm:inline">Online</span>
                                {(onlineUsers || []).length-1 > 0 && (
                                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                                        {(onlineUsers || []).length-1}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

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

                {/* Dynamic Header Title */}
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {activeView === 'chats' ? (
                        <>
                            <MessageSquare className="w-5 h-5 text-indigo-600" />
                            Recent Chats
                        </>
                    ) : (
                        <>
                            <Users className="w-5 h-5 text-green-600" />
                            Online Users
                        </>
                    )}
                </h2>

                {/* Subtitle */}
                {activeView === "chats" && (chatPeers || []).length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                        {(chatPeers || []).length} conversations
                    </p>
                )}

                {activeView !== "chats" && (onlineUsers || []).length - 1 > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                        {(onlineUsers || []).length - 1} users online
                    </p>
                )}

            </div>

            {/* Content Area with Smooth Transition */}
            <div className="flex-1 overflow-hidden relative">
                {/* Chats View */}
                <div className={`
          absolute inset-0 transition-all duration-300 ease-in-out
          ${activeView === 'chats'
                        ? 'translate-x-0 opacity-100'
                        : '-translate-x-full opacity-0 pointer-events-none'
                    }
        `}>
                    <div className="h-full overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-1 sm:space-y-2">
                        {chatPeers?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-4">
                                <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" />
                                <p className="text-gray-500 text-sm sm:text-base">No recent chats</p>
                                <p className="text-gray-400 text-xs sm:text-sm mt-1">Start a conversation with someone online</p>
                            </div>
                        ) : (
                            <ChatPeersList
                                chatPeers={chatPeers}
                                selectedReceiver={selectedReceiver}
                                setSelectedReceiver={setSelectedReceiver}
                                setIsChattingWindowOpen={setIsChattingWindowOpen}
                                setIsChatLoading={setIsChatLoading}
                                getMessagesHistory={getMessagesHistory}
                                isTyping={isTyping}
                                isChattingWindowOpen={isChattingWindowOpen}
                            />
                        )}
                    </div>
                </div>

                {/* Online Users View */}
                <div className={`
          absolute inset-0 transition-all duration-300 ease-in-out
          ${activeView === 'online'
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-full opacity-0 pointer-events-none'
                    }
        `}>
                    <div className="h-full overflow-y-auto p-3 sm:p-4 lg:p-5 space-y-1 sm:space-y-2">
                        {(onlineUsers || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center px-4">
                                <div className="relative">
                                    <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mb-2 sm:mb-3" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-gray-200 rounded-full animate-pulse"></div>
                                </div>
                                <p className="text-gray-500 text-sm sm:text-base">No users online</p>
                                <p className="text-gray-400 text-xs sm:text-sm mt-1">Check back later</p>
                            </div>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SidebarToggle;   