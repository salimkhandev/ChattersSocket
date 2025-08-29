import React, { useState, useEffect } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "../../context/CallContext";
import { useProfile } from "../../context/ProfileContext";

export default function CallUIPlaceholder({ socket, username }) {
    const {
        incomingCall,
        acceptCall,
        rejectCall,
        setCallAccepted,
        callerFullname,
        setOutGoingCall,
        callerProfilePic,
        setCallerProfilePic
    } = useCall();
    const { profilePIc } = useProfile();
    const [ripples, setRipples] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    // Fade in animation when component mounts
    useEffect(() => {
        if (incomingCall) {
            setIsVisible(true);
        }
    }, [incomingCall]);

    // Ripple animation for profile picture
    useEffect(() => {
        if (!incomingCall) return;

        const interval = setInterval(() => {
            const newRipple = {
                id: Date.now() + Math.random(),
                scale: 1,
                opacity: 1
            };
            setRipples(prev => [...prev.slice(-2), newRipple]);
        }, 1500);

        return () => clearInterval(interval);
    }, [incomingCall]);

    // Animate ripples
    useEffect(() => {
        if (!incomingCall) return;

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
    }, [incomingCall]);

    const handleRejectCall = () => {
        setIsVisible(false);
        setTimeout(() => {
            socket.emit("rejectCall", { username });
            rejectCall();
        }, 200);
    };

    const handleAcceptCall = () => {
        setIsVisible(false);
        setTimeout(() => {
            setCallAccepted(true);
            acceptCall();
            socket.emit("acceptCall", { username, profilePIc });
        }, 200);
    };
    useEffect(() => {
        let audio;
        if (incomingCall) {
            audio = new Audio("/notification/incoming-call.mp3");
            audio.loop = true;
            audio.play().catch(() => {
                console.warn("Autoplay blocked by browser😒😒😒");
            });
        }
        return () => {
            if (audio) {
                audio.pause();
                audio = null;
            }
        };
    }, [incomingCall]);

    if (!incomingCall) return null;


    return (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
            {/* Backdrop with blur effect */}

            <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>

            {/* Animated particles */}
            <div className="absolute inset-0">
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            {/* Main content */}
            <div className={`relative z-10 flex justify-center items-center min-h-screen p-4 transition-all duration-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}>
                {/* Call card */}
                <div className="relative w-full max-w-sm mx-auto">
                    {/* Glassmorphism card */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
                        {/* Header */}
                        <div className="text-center mb-6">
                            < div className="text-white/80 text-sm sm:text-base mb-2">Incoming Call   <div className="flex items-center justify-center space-x-2 text-blue-300">
                                <Phone size={16} className="animate-pulse" />
                            </div> 
                            </div>
                          
                        </div>

                        {/* Profile section */}
                        <div className="text-center mb-8">
                            <div className="relative mb-4 flex justify-center">
                                {/* Ripple effects */}
                                {ripples.map(ripple => (
                                    <div
                                        key={ripple.id}
                                        className="absolute border-2 border-blue-400/20 rounded-full"
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

                                {/* Profile picture */}
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 border-white/30 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 z-10">
                                    {callerProfilePic ? (
                                        <img
                                            src={callerProfilePic}
                                            alt={callerFullname.callerFullname || "Caller"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                                                {callerFullname.callerFullname?.charAt(0) || "?"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Caller name */}
                            <h2 className="text-white text-lg sm:text-xl font-bold mb-2 drop-shadow-lg">
                                {callerFullname.callerFullname || "Unknown Caller"}
                            </h2>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-4">
                            {/* Reject button */}
                            <button
                                onClick={handleRejectCall}
                                className="flex-1 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm border border-red-400/30 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 shadow-lg"
                            >
                                <PhoneOff size={18} />
                                <span className="text-sm sm:text-base">Decline</span>
                            </button>

                            {/* Accept button */}
                            <button
                                onClick={handleAcceptCall}
                                className="flex-1 bg-green-500/80 hover:bg-green-500 backdrop-blur-sm border border-green-400/30 text-white py-3 px-4 rounded-2xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 shadow-lg"
                            >
                                <Phone size={18} />
                                <span className="text-sm sm:text-base">Accept</span>
                            </button>
                        </div>

                       
                    </div>

             
                </div>
            </div>

        </div>
    );
}