import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, Phone } from "lucide-react";
import { useCall } from "../../context/CallContext";

export default function OutgoingCallUI({
    calleeFullname,
    selectedReceiverProfilePic,
    socket,
    username,
    cleanupMedia,
    performCallCleanup

}) {
    const [audioContext] = useState(null);
    const [ripples, setRipples] = useState([]);
    const { rejectCall, callID, localVideoRefForOutgoing, localVideoRef2, cleanupMedia2, setShowVideo, setOutGoingCall } = useCall();

    const audioRef = useRef(null); // 🎵 for ringtone

    // 🎵 Play ringtone on mount
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch(err => {
                console.warn("Autoplay blocked, user interaction needed:", err);
            });
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, []);

    // Ripple animation
    useEffect(() => {
        const interval = setInterval(() => {
            const newRipple = {
                id: Date.now() + Math.random(),
                scale: 1,
                opacity: 1
            };
            setRipples(prev => [...prev.slice(-2), newRipple]);
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    // Animate ripples
    useEffect(() => {
        const interval = setInterval(() => {
            setRipples(prev =>
                prev
                    .map(ripple => ({
                        ...ripple,
                        scale: ripple.scale + 0.03,
                        opacity: ripple.opacity - 0.015
                    }))
                    .filter(ripple => ripple.opacity > 0)
            );
        }, 50);

        return () => clearInterval(interval);
    }, []);

    // 📡 Socket listener
    useEffect(() => {
        socket.on("call-rejected", () => {
            performCallCleanup();
            rejectCall();
            cleanupMedia();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        });

        return () => {
            socket.off("call-rejected");
        };
    }, [socket, audioContext, rejectCall, cleanupMedia]);

    const handleCancel = () => {

        performCallCleanup();   
        socket.emit("end call", {
            username: username,
            callID: callID
        });

        if (audioContext && audioContext.state !== "closed") {
            audioContext.close();
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    return (
        <div className="fixed inset-0 z-50 w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* 🎵 Local audio for ringing */}
            <audio ref={audioRef} src="/notification/outgoing-call.mp3" loop />

            {/* Fullscreen Local Video Background */}
            <div className="absolute inset-0 w-full h-full z-10">
                <video
                    ref={localVideoRefForOutgoing}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-black/40 z-10"></div>
            </div>

            {/* Profile section - Right side */}
            <div className="absolute top-0 right-0 h-full w-full sm:w-96 md:w-80 lg:w-96 z-30 flex flex-col">
                {/* Profile container */}
                <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-8 py-8">
                    {/* Callee profile */}
                    <div className="text-center">
                        <div className="relative mb-6 flex justify-center">
                            {/* Ripple effects */}
                            {ripples.map(ripple => (
                                <div
                                    key={ripple.id}
                                    className="absolute border-2 border-white/20 rounded-full"
                                    style={{
                                        width: `${120 * ripple.scale}px`,
                                        height: `${120 * ripple.scale}px`,
                                        opacity: ripple.opacity,
                                        transform: "translate(-50%, -50%)",
                                        left: "50%",
                                        top: "50%"
                                    }}
                                />
                            ))}

                            {/* Avatar */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-white/50 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 z-10">
                                {selectedReceiverProfilePic ? (
                                    <img
                                        src={selectedReceiverProfilePic}
                                        alt={calleeFullname || "Profile"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold">
                                        {calleeFullname?.charAt(0) || "?"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-3 mb-8">
                            <h1 className="text-white text-lg sm:text-xl md:text-2xl font-bold drop-shadow-lg">
                                {calleeFullname || "Unknown"}
                            </h1>
                            <div className="flex items-center justify-center space-x-2 text-blue-200">
                                <Phone size={14} className="animate-pulse" />
                                <span className="text-sm sm:text-base drop-shadow">Ranging...</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls - Bottom right */}
                <div className="flex-shrink-0 pb-8 sm:pb-12 px-6 sm:px-8">
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={handleCancel}
                            className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 hover:scale-110 transition-all duration-200 active:scale-95"
                        >
                            <PhoneOff size={20} className="text-white sm:w-6 sm:h-6" />
                        </button>

                        <div className="flex items-center justify-center space-x-2 text-white/80">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-xs sm:text-sm drop-shadow">Connecting...</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Profile overlay for smaller screens */}
            <div className="sm:hidden absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none"></div>

            {/* Mobile: Centered profile for very small screens */}
            <div className="sm:hidden absolute inset-0 z-30 flex flex-col justify-center items-center px-4 pointer-events-none">
                <div className="text-center pointer-events-auto">
                    <div className="relative mb-4 flex justify-center">
                        {/* Mobile ripples */}
                        {ripples.map(ripple => (
                            <div
                                key={`mobile-${ripple.id}`}
                                className="absolute border-2 border-white/15 rounded-full"
                                style={{
                                    width: `${100 * ripple.scale}px`,
                                    height: `${100 * ripple.scale}px`,
                                    opacity: ripple.opacity * 0.7,
                                    transform: "translate(-50%, -50%)",
                                    left: "50%",
                                    top: "50%"
                                }}
                            />
                        ))}

                        {/* Mobile Avatar */}
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 z-10">
                            {selectedReceiverProfilePic ? (
                                <img
                                    src={selectedReceiverProfilePic}
                                    alt={calleeFullname || "Profile"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                                    {calleeFullname?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Info */}
                    <div className="space-y-2 mb-6">
                        <h1 className="text-white text-lg font-bold drop-shadow-lg">
                            {calleeFullname || "Unknown"}
                        </h1>
                        <div className="flex items-center justify-center space-x-2 text-blue-200">
                            <Phone size={12} className="animate-pulse" />
                            <span className="text-sm drop-shadow">Ranging...</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: Bottom controls */}
            <div className="sm:hidden absolute bottom-0 left-0 right-0 z-40 pb-8 px-4">
                <div className="flex flex-col items-center space-y-4">
                    <button
                        onClick={handleCancel}
                        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 hover:scale-110 transition-all duration-200 active:scale-95"
                    >
                        <PhoneOff size={24} className="text-white" />
                    </button>

                    <div className="flex items-center justify-center space-x-2 text-white/80">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-sm drop-shadow">Connecting...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}