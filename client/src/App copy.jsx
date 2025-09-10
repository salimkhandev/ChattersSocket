<aside className={`
                      ${selectedReceiver && !isMobileMenuOpen ? 'hidden lg:flex' : 'flex'} 
                      w-full lg:w-80 bg-white border-r flex-col
                      ${isMobileMenuOpen && selectedReceiver ? 'absolute inset-0 z-30 bg-white' : ''}
                    `}>
  <div className="p-4 sm:p-5 border-b">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-semibold text-indigo-600 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Chats
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
  </div>
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