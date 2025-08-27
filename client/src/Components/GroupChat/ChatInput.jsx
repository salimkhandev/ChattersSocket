"use client";
import React, { useState } from "react";
import { Smile, Send } from "lucide-react";

const emojiList = ["😀", "😂", "😍", "❤️", "👍", "🔥", "😊", "🎉"];

const ChatInput = React.memo(({ onSend }) => {
    const [message, setMessage] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message);
        setMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-3 sm:p-4 md:p-6 bg-white border-t border-gray-200">
            <div className="flex items-end gap-2 md:gap-3 relative max-w-4xl mx-auto">
                {/* Text Input */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full px-3 py-2.5 sm:px-4 sm:py-3 pr-12 sm:pr-14 border rounded-lg sm:rounded-xl focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-indigo-100 text-sm sm:text-base resize-none min-h-[44px] sm:min-h-[48px]"
                    />

                    {/* Emoji Button - Inside input on mobile, outside on desktop */}
                    <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 md:hidden">
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            title="Insert Emoji"
                        >
                            <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                </div>

                {/* Emoji Button - Desktop only (outside input) */}
                <div className="relative hidden md:block">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Insert Emoji"
                    >
                        <Smile className="w-6 h-6" />
                    </button>
                </div>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                    <>
                        {/* Click outside overlay */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowEmojiPicker(false)}
                        />
                        <div className="absolute bottom-full right-0 md:right-auto mb-2 bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-lg p-2 sm:p-3 z-50">
                            <div className="grid grid-cols-4 gap-1 sm:gap-2 min-w-[140px] sm:min-w-[160px]">
                                {emojiList.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        className="text-lg sm:text-xl hover:bg-gray-100 p-1.5 sm:p-2 rounded transition-colors active:bg-gray-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMessage((prev) => prev + emoji);
                                            setShowEmojiPicker(false);
                                        }}
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Send Button */}
                <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl text-white transition bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px] sm:min-w-[80px] justify-center text-sm sm:text-base font-medium active:bg-[#4338ca] whitespace-nowrap"
                >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Send</span>
                </button>
            </div>
        </div>
    );
});

export default ChatInput;