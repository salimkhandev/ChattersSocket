"use client";
import React, { useState ,useEffect} from "react";
import { useCall } from "../../context/CallContext";

export default function VideoDisplay({ localRef, remoteRef, socket, username, currentIsVideo, callerName,
    profilePic,
    callerProfilePic, }) {
    const [isLocalMinimized, setIsLocalMinimized] = useState(false);
    const [isLocalDragging, setIsLocalDragging] = useState(false);
   // ✅ get local stream from context
    // ❤️❤️

    const { callReceiverProfilePic, callReceiverFullname2, cleanupMedia2 } = useCall();
    const [callTime, setCallTime] = useState(0); // seconds

    useEffect(() => {
        if (remoteRef.current) {
            remoteRef.current.play().catch((err) => {
                console.error("Error playing remote audio:", err);
            });
        }
    }, [remoteRef, callerName, profilePic]);

    // Timer logic
    useEffect(() => {
        const timer = setInterval(() => {
            setCallTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(timer); // cleanup on unmount
    }, []);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const handleEndCall = () => {

        // cleanupMedia2()


        if (socket) {
            socket.emit("end call", { username });
        }
    };
    // ❤️❤️

    const toggleLocalVideo = () => {
        setIsLocalMinimized(!isLocalMinimized);
    };






    return (
        <>
        { currentIsVideo?
            
            <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">

            {/* Remote video */}
            <div className="absolute inset-0">
                <video
                    ref={remoteRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-5 pointer-events-none"></div>
            </div>

            {/* Video controls overlay */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
            </div>

            {/* Local video */}
            <div
                className={`absolute transition-all duration-300 ease-in-out pointer-events-auto z-20 ${isLocalMinimized
                    ? 'top-4 right-4 w-16 h-16'
                    : 'top-4 right-4 w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 lg:w-56 lg:h-32'
                    } ${isLocalDragging ? 'cursor-move' : 'cursor-pointer'}`}
                onClick={toggleLocalVideo}
            >
                <video
                    ref={localRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover rounded-lg shadow-2xl border-2 border-white/20 backdrop-blur-sm transition-all duration-300 ${isLocalMinimized ? 'scale-x-[-1] rounded-full' : 'scale-x-[-1]'
                        }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>

                {!isLocalMinimized && (
                    <div className="absolute bottom-1 left-1 right-1 text-center">
                        <span className="text-xs font-medium text-white/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                            You
                        </span>
                    </div>
                )}
            </div>

            {/* ✅ End Call Button - Highest z-index, always visible and clickable */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[21] pointer-events-auto">
                <button
                    onClick={handleEndCall}
                    className="px-8 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm border border-red-500/30"
                >
                    End Call
                </button>
            </div>
        </div>:(
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 text-white">
                        {/* Conditional Caller Profile Pic */}
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                            <img
                                src={callReceiverFullname2?.name ? callReceiverProfilePic : callerProfilePic}
                                alt={callerName}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Caller Name */}
                        <h2 className="mt-4 text-xl font-semibold">
                            {callReceiverFullname2?.name ? callReceiverFullname2.name : callerName}
                        </h2>

                        {/* Audio Call Label */}
                        <p className="text-gray-300">Audio Call</p>

                        {/* Timer */}
                        <p className="text-gray-300 text-lg mt-2">{formatTime(callTime)}</p>

                        {/* Hidden audio */}
                        <video
                            ref={remoteRef}
                            autoPlay
                            playsInline
                            className="hidden"
                        />
                        <video
                            ref={localRef}
                            autoPlay
                            playsInline
                            muted
                            className="hidden"
                          
                        />

                        {/* End Call Button */}
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[21] pointer-events-auto">
                            <button
                                onClick={handleEndCall}
                                className="px-8 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-sm border border-red-500/30"
                            >
                                End Call
                            </button>
                        </div>
                    </div>

        )
    }
        </>
    );
}