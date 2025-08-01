'use client';
import React, { useState, useRef } from "react";
import { Smile, XCircle,Send, Mic, StopCircle } from "lucide-react";

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
    // const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [showStopIcon, setShowStopIcon] = useState(false);
    const [showRecordIcon, setShowRecordIcon] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recorderRef = useRef();
    const { localUrl, setLocalUrl, localFormat, setLocalFormat, isModalOpen,setIsModalOpen} = useMedia();

    const handleStart = () => {
        recorderRef.current?.startRecording(); 
        setShowStopIcon(true)
        setShowRecordIcon(false)
        // ✅ calls inside child
    };
    const handleStop = () => {
        recorderRef.current?.stopRecording();
        setShowRecordIcon(false)
        setShowStopIcon(false)
    };
    return (
        <div className="mt-4 bg-white rounded-lg border shadow-sm relative">
            {/* Emoji Picker */}
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

            {/* Input & Buttons */}
            <div className="p-3 flex items-center gap-2">
            {  !isRecording &&  <input
                    className="flex-1 px-4 py-2 text-base focus:outline-none"
                    placeholder="Type a message..."
                    value={message}
                    onChange={handleTyping}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />}
                {isRecording && (
                    <div className="px-4 pb-3 flex-1 px-12 py-2 text-base focus:outline-none">
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

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white p-4 rounded-xl max-w-md w-full relative">
                            <MediaPreview />

                            <XCircle
                                onClick={() => {
                                    setLocalFormat(null);
                                    setLocalUrl(null);
                                    setIsModalOpen(false)
                                }}
                                className="text-red-500 cursor-pointer absolute top-2 right-2"
                            />
                        </div>
                    {/* </div> */}
                    </div>
                )}

                {/* Emoji Button */}
             { !isRecording &&  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Insert Emoji"
                >
                    <Smile className="w-5 h-5 text-gray-500" />
                </button>}
                <div className="px-4 py-2">
                    <UploadMedia
                        sender={sender}
                        receiver={selectedReceiver}
                        socket={socket}
                        // onOpenPreview={() => setIsMediaModalOpen(true)} // 👈 pass this
                    />                </div>
                


                {/* Voice Button (Toggle Recorder UI) */}
                {/* Mic Button (Start Recording) */}
                {!isRecording || showRecordIcon ? (
                    <button
                        onClick={() => {
                            setIsRecording(true);
                            setTimeout(() => handleStart(), 0);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Start Recording"
                    >
                        <Mic className="w-5 h-5 text-gray-500" />
                    </button>
                ):null}

                {/* Stop Button (Stop Recording) */}
                {isRecording && showStopIcon && (
                    <button
                        onClick={() => {
                            setTimeout(() => handleStop(), 0);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Stop Recording"
                    >
                        <StopCircle className="w-5 h-5 text-red-500" />
                    </button>
                )}


                {/* Send Button */}
               { !isRecording  && <button
                    onClick={sendMessage}
                    disabled={!message.trim() || !selectedReceiver}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-white transition ${message.trim() && selectedReceiver
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-gray-300 cursor-not-allowed"
                        }`}
                >
                    <Send className="w-4 h-4" />
                    Send
                </button>}
            </div>

            {/* Voice Recorder Panel */}
            {/* {isRecording && (
                <div className="px-4 pb-3">
                    <VoiceRecorder
                        socket={socket}
                        sender={sender}
                        receiver={selectedReceiver}
                        ref={recorderRef}
                        onDone={() => setIsRecording(false)}
                    />
                </div>
            )} */}
        </div>
    );
};

export default React.memo(MessageInput);
