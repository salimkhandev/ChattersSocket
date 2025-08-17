"use client";
import React, { useEffect } from "react";

export default function AudioCallDisplay({ remoteVideoRef2, callerName, profilePic, username, socket, callerUsername,callerProfilePic }) {
    useEffect(() => {
        if (remoteVideoRef2.current) {
            remoteVideoRef2.current.play().catch((err) => {
                console.error("Error playing remote audio:", err);
            });
        }
    }, [remoteVideoRef2, callerName, profilePic]);
    const handleEndCall = () => {
        if (socket) {
            socket.emit("end call", { username }); // or { user: username } if backend expects "user"

        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-gray-900 text-white">
            {/* Caller Profile Pic */}
          { callerUsername === username &&
           <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                <img
                     src={profilePic}
                    alt={callerName}
                    className="w-full h-full object-cover"
                />
            </div>
            }
            { <div>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-500 shadow-lg">
                    <img
                        src={callerProfilePic}
                        alt={callerName}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>}

            {/* Caller Name */}
            <h2 className="mt-4 text-xl font-semibold">{callerName}</h2>
            <p className="text-gray-300">Audio Call</p>

            {/* Hidden audio but plays */}
            <audio
                ref={remoteVideoRef2}
                autoPlay
                playsInline
                controls={false}
                className="hidden"
            />
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
