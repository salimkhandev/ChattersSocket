'use client';
import React, { useState, useRef } from "react";
import { Smile, XCircle, Send, Mic, StopCircle } from "lucide-react";

import VoiceRecorder from "./VoiceMessgae/VoiceRecorder"; // <-- Adjust the path if needed
import UploadMedia from './SendMedia/UploadMedia'; // adjust path if needed
import { useMedia } from "../../context/MediaContext";
import MediaPreview from './SendMedia/MediaPreview';

const emojiList = ["😀", "😂", "😍", "😎", "👍", "🙏", "🎉", "💯", "❤️", "🔥", "🤔", "🙌"];

const MessageInput = ({
    message,
    setMessage,
    sendMessage,
    handleTyping,
    selectedReceiver,
    socket,
    sender,
}) => {
    const [showStopIcon, setShowStopIcon] = useState(false);
    const [showRecordIcon, setShowRecordIcon] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recorderRef = useRef();
    const { localUrl, setLocalUrl, localFormat, setLocalFormat, isModalOpen, setIsModalOpen } = useMedia();

    const handleStart = () => {
        recorderRef.current?.startRecording();
        setShowStopIcon(true);
        setShowRecordIcon(false);
    };

    const handleStop = () => {
        recorderRef.current?.stopRecording();
        setShowRecordIcon(false);
        setShowStopIcon(false);
    };

    const closeModal = () => {
        setLocalFormat(null);
        setLocalUrl(null);
        setIsModalOpen(false);
    };

    return (
        <div className="mt-2 sm:mt-4 bg-white rounded-lg border shadow-sm relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className="absolute bottom-full left-2 sm:right-0 sm:left-auto mb-2 bg-white border border-gray-300 rounded-xl shadow-lg p-2 sm:p-3 grid grid-cols-4 sm:grid-cols-6 gap-1 sm:gap-2 z-50 max-w-xs sm:max-w-none">
                    {emojiList.map((emoji, idx) => (
                        <button
                            key={idx}
                            className="text-lg sm:text-xl hover:scale-110 sm:hover:scale-125 transition-transform p-1 rounded"
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

            {/* Media Preview Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg relative">
                        <MediaPreview />
                        <button
                            onClick={closeModal}
                            className="absolute -top-2 -right-2 sm:top-2 sm:right-2 p-1 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                            aria-label="Close preview"
                        >
                            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                        </button>
                    </div>
                </div>
            )}

            {/* Main Input Container */}
            <div className="p-2 sm:p-3 flex items-center gap-1 sm:gap-2">
                {/* Text Input */}
                {!isRecording && (
                    <input
                        className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base focus:outline-none min-w-0"
                        placeholder="Type a message..."
                        value={message}
                        onChange={handleTyping}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                )}

                {/* Voice Recording UI */}
                {isRecording && (
                    <div className="flex-1 px-2 sm:px-3 py-2 min-w-0">
                        <VoiceRecorder
                            socket={socket}
                            sender={sender}
                            setIsRecording={setIsRecording}
                            receiver={selectedReceiver}
                            ref={recorderRef}
                            onDone={() => setIsRecording(false)}
                        />
                    </div>
                )}

                {/* Action Buttons Container */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {/* Emoji Button */}
                    {!isRecording && (
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="Insert Emoji"
                            aria-label="Insert Emoji"
                        >
                            <Smile className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                        </button>
                    )}

                    {/* Upload Media Button */}
                   {!isRecording && <div className="flex items-center">
                        <UploadMedia
                            sender={sender}
                            receiver={selectedReceiver}
                            socket={socket}
                        />
                    </div>}

                    {/* Mic Button (Start Recording) */}
                    {(!isRecording || showRecordIcon) && (
                        <button
                            onClick={() => {
                                setIsRecording(true);
                                setTimeout(() => handleStart(), 0);
                            }}
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
                            title="Start Recording"
                            aria-label="Start Recording"
                        >
                            <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                        </button>
                    )}

                    {/* Stop Button (Stop Recording) */}
                    {isRecording && showStopIcon && (
                        <div className="flex justify-left w-full">
                            <button
                                onClick={() => {
                                    setTimeout(() => handleStop(), 0);
                                }}
                                className="ml-8 sm:ml-12 md:ml-16 p-1.5 sm:p-2 hover:bg-red-50 rounded-full transition-colors"
                                title="Stop Recording"
                                aria-label="Stop Recording"
                            >
                                <StopCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                            </button>
                        </div>
                    )}

                    {/* Send Button */}
                    {!isRecording && (
                        <button
                            onClick={sendMessage}
                            disabled={!message.trim() || !selectedReceiver}
                            className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-sm sm:text-base font-medium transition-all ${message.trim() && selectedReceiver
                                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-sm hover:shadow-md"
                                    : "bg-gray-300 cursor-not-allowed"
                                }`}
                            aria-label="Send message"
                        >
                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Send</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(MessageInput);