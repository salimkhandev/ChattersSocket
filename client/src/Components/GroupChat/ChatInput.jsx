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
        <div className="p-4 bg-white border-t">
            <div className="flex items-center gap-2 relative">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-gray-300"
                />
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker((prev) => !prev)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Insert Emoji"
                    >
                        <Smile className="w-6 h-6" />
                    </button>
                    {showEmojiPicker && (
                        <>
                            {/* Click outside overlay */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowEmojiPicker(false)}
                            />
                            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 z-50 min-w-[120px]">
                                {emojiList.map((emoji, idx) => (
                                    <button
                                        key={idx}
                                        className="text-xl hover:bg-gray-100 p-1 rounded transition-colors"
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
                        </>
                    )}
                </div>
                <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-white transition bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                    Send
                </button>
            </div>
        </div>
    );
});

export default ChatInput;
