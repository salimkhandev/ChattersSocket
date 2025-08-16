    import React, { useEffect, useRef, useState } from "react";
    import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone } from "lucide-react";
    import { useCall } from "../../context/CallContext";

    export default function OutgoingCallUI({
        calleeFullname,
        selectedReceiverProfilePic,
        socket,
        username,
        cleanupMedia
    }) {
        const [audioContext, setAudioContext] = useState(null);
        // const [stream, setStream] = useState(null);
        const [ripples, setRipples] = useState([]);
        const { rejectCall, callID, localVideoRef2 } = useCall();

        const videoRef = useRef(null);
        const audioRef = useRef(null); // 🎵 for ringtone

        // attach localStream to video
        // useEffect(() => {
        //     if (videoRef.current && localStream) {
        //         videoRef.current.srcObject = localStream;
        //     }
        // }, [localStream]);

        // 🎵 Play ringtone on mount
        useEffect(() => {
            if (audioRef.current) {
                audioRef.current.play().catch(err => {
                    console.warn("Autoplay blocked, user interaction needed:", err);
                });
            }
            return () => {
                // if (audioRef.current) {
                //     audioRef.current.pause();
                //     // audioRef.current.currentTime = 0;
                // }
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
        }, [socket, audioContext,rejectCall, cleanupMedia]);

        const handleCancel = () => {
            socket.emit("end call", {
                username: username,
                callID: callID
            });

            // if (audioContext && audioContext.state !== "closed") {
            //     audioContext.close();
            // }
            
            // // if (localStream) {
            // //     localStream.getTracks().forEach(track => track.stop());
            // // }
            // if (audioRef.current) {
            //     audioRef.current.pause();
            //     audioRef.current.currentTime = 0;
            // }
        };

        return (
            <div className="fixed inset-0 z-50 w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                {/* 🎵 Local audio for ringing */}
                <audio ref={audioRef} src="/sounds/ringtone.mp3" loop />

                {/* Animated particles */}
                <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
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

                {/* Main container */}
                <div className="relative z-10 h-full flex flex-col">
                    {/* Main content */}
                    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
                        {/* Callee profile */}
                        <div className="text-center">
                            <div className="relative mb-6 flex justify-center">
                                {/* Ripple effects */}
                                {ripples.map(ripple => (
                                    <div
                                        key={ripple.id}
                                        className="absolute border-2 border-blue-400/20 rounded-full"
                                        style={{
                                            width: `${150 * ripple.scale}px`,
                                            height: `${150 * ripple.scale}px`,
                                            opacity: ripple.opacity,
                                            transform: "translate(-50%, -50%)",
                                            left: "50%",
                                            top: "50%"
                                        }}
                                    />
                                ))}

                                {/* Avatar */}
                                <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 z-10">
                                    {selectedReceiverProfilePic ? (
                                        <img
                                            src={selectedReceiverProfilePic}
                                            alt={calleeFullname || "Profile"}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xl sm:text-3xl lg:text-4xl font-bold">
                                            {calleeFullname}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-2 mb-8">
                                <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                                    {calleeFullname || "Unknown"}
                                </h1>
                                <div className="flex items-center justify-center space-x-2 text-blue-300">
                                    <Phone size={16} className="animate-pulse" />
                                    <span className="text-sm sm:text-base">Calling...</span>
                                </div>
                            </div>
                        </div>

                        {/* Local video */}
                        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                            <div className="relative w-full aspect-video bg-gray-900/80 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                                <video
                                    ref={localVideoRef2}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover scale-x-[-1]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-3 left-3">
                                    <span className="text-xs sm:text-sm font-medium text-white bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                        You
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex-shrink-0 pb-8 sm:pb-12 px-4 sm:px-6">
                        <div className="flex flex-col items-center space-y-6">
                            <button
                                onClick={handleCancel}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 rounded-full flex items-center justify-center shadow-xl hover:bg-red-600 hover:scale-110 transition-all duration-200 active:scale-95"
                            >
                                <PhoneOff size={24} className="text-white sm:w-8 sm:h-8" />
                            </button>

                            <div className="flex items-center justify-center space-x-2 text-white/60">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                <span className="text-sm">Connecting...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
