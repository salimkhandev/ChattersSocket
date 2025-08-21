"use client";
import React, { useEffect, useState } from "react";
import { useCall } from "../../context/CallContext";

export default function AudioCallDisplay({
    remoteVideoRef2,
    localRef
    callerName,
    profilePic,
    username,
    socket,
    callerProfilePic,
}) {
    const { callReceiverProfilePic, callReceiverFullname2, cleanupMedia2 } = useCall();
    const [callTime, setCallTime] = useState(0); // seconds

    useEffect(() => {
        if (remoteVideoRef2.current) {
            remoteVideoRef2.current.play().catch((err) => {
                console.error("Error playing remote audio:", err);
            });
        }
    }, [remoteVideoRef2, callerName, profilePic]);

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
        // setOutGoingCall(false)

        if (socket) {
            socket.emit("end call", { username });
        }
    };


    return (
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
            <audio
                ref={remoteVideoRef2}
                autoPlay
                playsInline
                controls={false}
                className="hidden"
            />
            <audio
                ref={localRef}
                muted
                controls={false}
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
    );
}
