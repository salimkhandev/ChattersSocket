import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, Phone, Volume2 } from "lucide-react";
import { useCall } from "../../context/CallContext";

export default function AudioOutgoingCallUI({
    calleeFullname,
    selectedReceiverProfilePic,
    socket,
    username,
    cleanupMedia,
    performCallCleanup
}) {
    const [audioContext] = useState(null);
    const [ripples, setRipples] = useState([]);
    const { rejectCall, callID, cleanupMedia2, setOutGoingCall } = useCall();
    const [disabled, setDisabled] = useState(false);

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
            performCallCleanup()
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        });

        return () => {
            socket.off("call-rejected");
        };
    }, [socket, audioContext, rejectCall, cleanupMedia]);

    // Get initials for fallback avatar
    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleCancel = () => {
        setDisabled(true)
        performCallCleanup()
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

            {/* Animated particles */}
            <div className="absolute inset-0">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-20 animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Main container */}
            <div className="relative z-10 h-full flex flex-col">
                {/* Main content */}
                <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">

                    {/* Callee profile section */}
                    <div className="text-center">
                        <div className="relative mb-8 flex justify-center">
                            {/* Ripple effects */}
                            {ripples.map(ripple => (
                                <div
                                    key={ripple.id}
                                    className="absolute border-2 border-blue-400/30 rounded-full"
                                    style={{
                                        width: `${180 * ripple.scale}px`,
                                        height: `${180 * ripple.scale}px`,
                                        opacity: ripple.opacity,
                                        transform: "translate(-50%, -50%)",
                                        left: "50%",
                                        top: "50%"
                                    }}
                                />
                            ))}

                            {/* Large Avatar for Audio Call */}
                            <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-700 z-10">
                                {selectedReceiverProfilePic ? (
                                    <img
                                        src={selectedReceiverProfilePic}
                                        alt={calleeFullname || "Profile"}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}

                                {/* Fallback initials */}
                                <div className={`w-full h-full flex items-center justify-center text-white text-2xl sm:text-4xl lg:text-5xl font-bold ${selectedReceiverProfilePic ? 'hidden' : 'flex'}`}>
                                    {getInitials(calleeFullname)}
                                </div>
                            </div>

                            {/* Audio indicator */}
                            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-20">
                                <div className="flex items-center justify-center space-x-2 bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30">
                                    <Volume2 size={16} className="text-blue-300" />
                                    <div className="flex space-x-1">
                                        {[...Array(3)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-blue-400 rounded-full animate-pulse"
                                                style={{
                                                    height: `${6 + Math.random() * 8}px`,
                                                    animationDelay: `${i * 0.15}s`,
                                                    animationDuration: '1s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Caller Info */}
                        <div className="space-y-3 mb-12">
                            <h1 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">
                                {calleeFullname || "Unknown"}
                            </h1>
                            <div className="flex items-center justify-center space-x-2 text-blue-300">
                                <Phone size={18} className="animate-pulse" />
                                <span className="text-base sm:text-lg">Ranging...</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex-shrink-0 pb-12 sm:pb-16 px-4 sm:px-6">
                    <div className="flex flex-col items-center space-y-6">
                        {/* End Call Button */}
                        <button
                            onClick={handleCancel}
                            disabled={disabled} // disable when state is true
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 active:scale-95 border-4 border-red-400/30
        ${disabled ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 hover:scale-110"}`}
                        >
                            <PhoneOff size={24} className="text-white sm:w-8 sm:h-8" />
                        </button>
                        
                    </div>
                </div>
            </div>
        </div>
    );
}