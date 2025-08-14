"use client";
import React from "react";

export default function VideoDisplay({ localRef, remoteRef }) {
    return (
        <div className="relative w-full h-screen bg-black">
            {/* Remote video - full screen */}
            <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />

            {/* Local video - small top-left and mirrored */}
            <video
                ref={localRef}
                autoPlay
                playsInline
                muted
                className="absolute top-4 left-4 w-40 h-24 object-cover rounded shadow-lg border-2 border-white scale-x-[-1]"
            />
        </div>
    );
}
