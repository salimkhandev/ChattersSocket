import React, { useState, useEffect, useRef } from "react";
import { useCall } from "../../context/CallContext";
import { SwitchCamera } from "lucide-react"; // ✅ correct


export default function VideoDisplay({ localRef, remoteRef, socket, username, currentIsVideo, callerName,
    profilePic,
    callerProfilePic, performCallCleanup }) {

    const [isLocalMinimized, setIsLocalMinimized] = useState(false);
    const [isLocalDragging, setIsLocalDragging] = useState(false);

    const { callReceiverProfilePic, callReceiverFullname2, isConnected, timerRef, callTime, setCallTime, callStartRef, toggleCameraMode } = useCall(); 

    // Remote video/audio play
    useEffect(() => {
        if (remoteRef.current) {
            remoteRef.current.play().catch((err) => {
                console.error("Error playing remote audio:", err);
            });
        }
    }, [remoteRef]);

    // ✅ Timer starts only when isConnected becomes true
    // Timer effect
    useEffect(() => {
        if (isConnected) {
            // Reset everything at connection
            callStartRef.current = Date.now();
            setCallTime(0);

            timerRef.current = setInterval(() => {
                const diff = Math.floor((Date.now() - callStartRef.current) / 1000);
                setCallTime(diff);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            timerRef.current = null;
            callStartRef.current = null;
            setCallTime(0);
        }

        return () => clearInterval(timerRef.current);
    }, [isConnected]);



    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const handleEndCall = () => {
        const mins = Math.floor(callTime / 60).toString().padStart(2, "0");
        const secs = (callTime % 60).toString().padStart(2, "0");
        const durationString = `${mins}:${secs}`;

        if (callReceiverFullname2?.username) {
            socket.emit("chat messages", {
                sender: username?.trim() || "unknown",
                receiver: callReceiverFullname2?.username?.trim() || "unknown",
                message: `Call duration: ${durationString}`,
                type: "call",
            });
        } else if (callerName?.callerUsername) {
            socket.emit("chat messages", {
                sender: callerName?.callerUsername?.trim() || "unknown",
                receiver: username?.trim() || "unknown",
                message: `Call duration: ${durationString}`,
                type: "call",
            });
        } else {
            console.warn("⚠️ No valid sender/receiver found, message not emitted.");
        }

        socket.emit("end call", { username });

        // cleanup
        clearInterval(timerRef.current);
        timerRef.current = null;
        callStartRef.current = null;
        setCallTime(0);

        performCallCleanup();
    };



    const toggleLocalVideo = () => {
        setIsLocalMinimized(!isLocalMinimized);
    };


    return (
        <div className="fixed inset-0 z-[43] w-full h-full bg-black overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            {currentIsVideo ? (
                <div className="absolute inset-0 w-full h-full bg-black relative overflow-hidden">
                    {/* Fullscreen Remote Video Background */}
                    <div className="absolute inset-0 w-full h-full z-10">
                        <video
                            ref={remoteRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {/* Dark overlay for better UI visibility */}
                        <div className="absolute inset-0 bg-black/20 z-10"></div>
                    </div>

                    {/* Top overlay - Call info */}
                    <div className="absolute top-0 left-0 right-0 z-30 p-4 sm:p-6">
                        <div className="bg-black/30 backdrop-blur-sm rounded-xl px-4 py-3 sm:px-6 sm:py-4 inline-block">
                            <div className="flex items-center space-x-3">
                                {/* Caller profile pic */}

                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-green-400">
                                    <img
                                        src={callReceiverFullname2?.name ? callReceiverProfilePic : callerProfilePic}
                                        alt={callerName.callerFullname}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="text-white">
                                    <h3 className="text-sm sm:text-base font-semibold">
                                        {callReceiverFullname2?.name ? callReceiverFullname2.name : callerName.callerFullname}
                                    </h3>
                                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-300">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span>{formatTime(callTime)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Local video - Floating window */}
                    <div
                        className={`absolute transition-all duration-300 ease-in-out z-40 ${isLocalMinimized
                            ? 'top-4 right-4 w-12 h-12 sm:w-16 sm:h-16'
                            : 'top-20 right-4 sm:top-24 sm:right-6 w-24 h-16 sm:w-32 sm:h-20 md:w-40 md:h-24 lg:w-48 lg:h-28'
                            } ${isLocalDragging ? 'cursor-move' : 'cursor-pointer'}`}
                        onClick={toggleLocalVideo}
                    >
                        <video
                            ref={localRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover shadow-2xl border-2 border-white/30 backdrop-blur-sm transition-all duration-300 scale-x-[-1] ${isLocalMinimized ? 'rounded-full' : 'rounded-lg sm:rounded-xl'
                                }`}
                        />

                        {!isLocalMinimized && (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg sm:rounded-xl pointer-events-none"></div>
                                <div className="absolute bottom-1 left-1 right-1 text-center">
                                    <span className="text-xs font-medium text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        You
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* End Call Button - Bottom center */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 pb-8 sm:pb-12 px-4">
                        <div className="flex justify-center">
                            <button
                                onClick={handleEndCall}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                            >
                                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-4 4-4-4m0 8l4-4 4 4" />
                                </svg>
                            </button>
                        </div>

                        {/* Connection indicator */}
                        {/* Camera Toggle Button */}
                      

                        <div className="flex items-center justify-center mt-4 text-white/80">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50">
                                <button
                                    onClick={toggleCameraMode}
                                    className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
               text-white rounded-full shadow-lg focus:outline-none focus:ring-4 
               focus:ring-blue-500/50 transition-all duration-200 hover:scale-110 
               active:scale-95 flex items-center justify-center"
                                >
                                    <SwitchCamera className="w-6 h-6 sm:w-7 sm:h-7" />
                                </button>
                            </div>
                            <span className="text-sm drop-shadow">Connected</span>
                        </div>
                    </div>
                </div>
            ) : (
                // Audio Call UI - Fullscreen
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
                    {/* Animated particles for audio call */}
                    <div className="absolute inset-0">
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 bg-white rounded-full opacity-10 animate-pulse"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Audio call content */}
                    <div className="relative z-10 h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
                        {/* Profile picture */}
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-green-400/60 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                            <img
                                src={callReceiverFullname2?.name ? callReceiverProfilePic : callerProfilePic}
                                alt={callerName.callerFullname}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Caller info */}
                        <div className="text-center space-y-2">
                            <h2 className="text-white text-xl sm:text-2xl md:text-3xl font-bold drop-shadow-lg">
                                {callReceiverFullname2?.name ? callReceiverFullname2.name : callerName.callerFullname}
                            </h2>
                            <p className="text-blue-200 text-sm sm:text-base">Audio Call</p>
                            <div className="flex items-center justify-center space-x-2 text-green-300">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span className="text-lg sm:text-xl font-mono">{formatTime(callTime)}</span>
                            </div>
                        </div>

                        {/* Hidden audio elements */}
                        <video ref={remoteRef} autoPlay playsInline className="hidden" />
                        <video ref={localRef} autoPlay playsInline muted className="hidden" />
                    </div>

                    {/* End Call Button for Audio */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 pb-8 sm:pb-12 px-4">
                        <div className="flex justify-center">
                            <button
                                onClick={handleEndCall}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                            >
                                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-4 4-4-4m0 8l4-4 4 4" />
                                </svg>
                            </button>
                        </div>

                        {/* Connection indicator */}
                        <div className="flex items-center justify-center mt-4 text-white/80">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                            <span className="text-sm drop-shadow">Connected</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}