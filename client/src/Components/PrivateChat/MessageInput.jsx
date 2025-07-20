import React, { useState } from "react";
import { Smile, Send } from "lucide-react";

const emojiList = ["😀", "😂", "😍", "😎", "👍", "🙏", "🎉", "💯", "❤️", "🔥", "🤔", "🙌"];

const MessageInput = ({
    message,
    setMessage,
    sendMessage,
    handleTyping,
    selectedReceiver,
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    return (

        <div className="mt-4 bg-white rounded-lg border shadow-sm relative">
            {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-xl shadow-lg p-3 grid grid-cols-6 gap-2 z-50">
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
            <div className="p-3 flex items-center gap-2">
                <input
                    className="flex-1 px-4 py-2 text-base focus:outline-none"
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Insert Emoji"
                >
                    <Smile className="w-5 h-5 text-gray-500" />


                </button>
                < button
                    onClick={sendMessage}
                    disabled={!message.trim() || !selectedReceiver}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-white transition ${message.trim() && selectedReceiver
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-gray-300 cursor-not-allowed"
                        }`}
                >
                    <Send className="w-4 h-4" />
                    Send
                </button>
            </div>
        </div>
    );
};

export default React.memo(MessageInput);
