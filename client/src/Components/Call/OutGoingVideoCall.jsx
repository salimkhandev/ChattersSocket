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

            {/* Main Content - Centered and responsive */}
            <div className="absolute inset-0 z-30 flex flex-col justify-center items-center px-4 md:px-6 lg:px-8">
                {/* Profile container */}
                <div className="text-center">
                    <div className="relative mb-6 md:mb-8 flex justify-center">
                        {/* Ripple effects */}
                        {ripples.map(ripple => (
                            <div
                                key={ripple.id}
                                className="absolute border-2 border-white/20 rounded-full"
                                style={{
                                    width: `${(window.innerWidth < 640 ? 100 : 120) * ripple.scale}px`,
                                    height: `${(window.innerWidth < 640 ? 100 : 120) * ripple.scale}px`,
                                    opacity: ripple.opacity,
                                    transform: "translate(-50%, -50%)",
                                    left: "50%",
                                    top: "50%"
                                }}
                            />
                        ))}

                        {/* Avatar */}
                        <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border-3 border-white/50 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 z-10">
                            {selectedReceiverProfilePic ? (
                                <img
                                    src={selectedReceiverProfilePic}
                                    alt={calleeFullname || "Profile"}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl font-bold">
                                    {calleeFullname?.charAt(0) || "?"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 md:space-y-3 mb-8 md:mb-12">
                        <h1 className="text-white text-lg md:text-xl lg:text-2xl font-bold drop-shadow-lg max-w-xs md:max-w-md truncate">
                            {calleeFullname || "Unknown"}
                        </h1>
                        <div className="flex items-center justify-center space-x-2 text-blue-200">
                            <Phone size={14} className="animate-pulse md:w-4 md:h-4" />
                            <span className="text-sm md:text-base drop-shadow">Ranging...</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom controls - Fixed at bottom */}
            <div className="absolute bottom-8 md:bottom-12 left-0 right-0 z-40 px-4">
                <div className="flex flex-col items-center space-y-3 md:space-y-4">
                    <button
                        onClick={handleCancel}
                        className="w-14 h-14 md:w-16 md:h-16 lg:w-18 lg:h-18 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 hover:scale-110 transition-all duration-200 active:scale-95"
                    >
                        <PhoneOff size={20} className="text-white md:w-6 md:h-6" />
                    </button>

                    <div className="flex items-center justify-center space-x-2 text-white/80">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-xs md:text-sm drop-shadow">Connecting...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}