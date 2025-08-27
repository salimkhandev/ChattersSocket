import React, { useState, useEffect, useRef } from "react";
import { useCall } from "../../context/CallContext";
import { SwitchCamera, Maximize2, PhoneOff, VolumeX, Volume2, Phone, Speaker } from "lucide-react";

export default function VideoDisplay({ localRef, remoteRef, socket, username, currentIsVideo, callerName,
    profilePic,
    callerProfilePic, performCallCleanup }) {

    const [isLocalMinimized, setIsLocalMinimized] = useState(false);
    const [isLocalDragging, setIsLocalDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLocalExpanded, setIsLocalExpanded] = useState(false);
    const [isRemoteMuted, setIsRemoteMuted] = useState(false);
    const [audioOutput, setAudioOutput] = useState('default'); // 'default' or 'earpiece'
    const [availableAudioDevices, setAvailableAudioDevices] = useState([]);

    const { callReceiverProfilePic, callReceiverFullname2, isConnected, timerRef, callTime, setCallTime, callStartRef, toggleCameraMode } = useCall();

    // Check if device is mobile and get available audio devices
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024 && 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices);
        };

        const getAudioDevices = async () => {
            try {
                if ('mediaDevices' in navigator && 'enumerateDevices' in navigator.mediaDevices) {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
                    setAvailableAudioDevices(audioOutputs);
                    console.log('Available audio devices:', audioOutputs);
                }
            } catch (error) {
                console.error('Error getting audio devices:', error);
            }
        };

        checkMobile();
        getAudioDevices();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Remote video/audio play and audio routing
    useEffect(() => {
        const setupAudioRouting = async () => {
            if (remoteRef.current) {
                try {
                    // First, try to play the video
                    await remoteRef.current.play();

                    // For Android Chrome, try to set audio output
                    if (isMobile && 'setSinkId' in remoteRef.current) {
                        try {
                            // Try to route to earpiece/call speaker
                            const earpieceDevice = availableAudioDevices.find(device =>
                                device.label.toLowerCase().includes('earpiece') ||
                                device.label.toLowerCase().includes('receiver') ||
                                device.deviceId === 'communications'
                            );

                            if (earpieceDevice) {
                                await remoteRef.current.setSinkId(earpieceDevice.deviceId);
                                setAudioOutput('earpiece');
                                console.log('Audio routed to earpiece:', earpieceDevice.label);
                            } else {
                                // Fallback: try the 'communications' deviceId for call audio
                                await remoteRef.current.setSinkId('communications');
                                setAudioOutput('earpiece');
                                console.log('Audio routed to communications device');
                            }
                        } catch (sinkError) {
                            console.warn('Could not route to earpiece, using default audio:', sinkError);
                            // Fallback to default audio output
                            try {
                                await remoteRef.current.setSinkId('');
                                setAudioOutput('default');
                            } catch (defaultError) {
                                console.error('Could not set default audio output:', defaultError);
                            }
                        }
                    }

                    // Additional Android-specific audio settings
                    if (isMobile && remoteRef.current) {
                        // Set volume to maximum for call audio
                        remoteRef.current.volume = 1.0;

                        // Try to enable noise suppression and echo cancellation
                        const stream = remoteRef.current.srcObject;
                        if (stream && stream.getAudioTracks) {
                            const audioTracks = stream.getAudioTracks();
                            audioTracks.forEach(track => {
                                const constraints = track.getConstraints();
                                track.applyConstraints({
                                    ...constraints,
                                    echoCancellation: true,
                                    noiseSuppression: true,
                                    autoGainControl: true
                                }).catch(err => console.warn('Could not apply audio constraints:', err));
                            });
                        }
                    }

                } catch (err) {
                    console.error("Error setting up audio:", err);
                }
            }
        };

        setupAudioRouting();
    }, [remoteRef, isMobile, availableAudioDevices]);

    // Timer effect
    useEffect(() => {
        if (isConnected) {
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

    const toggleAudioOutput = async () => {
        if (remoteRef.current && 'setSinkId' in remoteRef.current && isMobile) {
            try {
                if (audioOutput === 'default') {
                    // Switch to earpiece/call speaker
                    const earpieceDevice = availableAudioDevices.find(device =>
                        device.label.toLowerCase().includes('earpiece') ||
                        device.label.toLowerCase().includes('receiver')
                    );

                    if (earpieceDevice) {
                        await remoteRef.current.setSinkId(earpieceDevice.deviceId);
                        setAudioOutput('earpiece');
                    } else {
                        // Try communications device
                        await remoteRef.current.setSinkId('communications');
                        setAudioOutput('earpiece');
                    }
                } else {
                    // Switch back to default (speaker)
                    await remoteRef.current.setSinkId('');
                    setAudioOutput('default');
                }
            } catch (error) {
                console.error('Error switching audio output:', error);
            }
        }
    };

    const toggleRemoteMute = () => {
        if (remoteRef.current) {
            remoteRef.current.muted = !remoteRef.current.muted;
            setIsRemoteMuted(!isRemoteMuted);
        }
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
        if (isLocalMinimized) {
            setIsLocalMinimized(false);
        } else if (isLocalExpanded) {
            setIsLocalExpanded(false);
        } else {
            setIsLocalExpanded(true);
        }
    };

    const handleRemoteClick = () => {
        if (isLocalExpanded) {
            setIsLocalExpanded(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[43] w-full h-full bg-black overflow-hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
            {currentIsVideo ? (
                <div className="absolute inset-0 w-full h-full bg-black relative overflow-hidden">
                    {/* Remote Video - Fullscreen when local not expanded, small when local expanded */}
                    <div
                        className={`absolute transition-all duration-500 ease-in-out ${isLocalExpanded
                                ? 'top-4 right-4 w-32 h-24 sm:w-40 sm:h-28 md:w-48 md:h-32 lg:w-56 lg:h-36 z-40 rounded-lg sm:rounded-xl border-2 border-white/30 shadow-2xl cursor-pointer'
                                : 'inset-0 w-full h-full z-10'
                            }`}
                        onClick={isLocalExpanded ? handleRemoteClick : undefined}
                    >
                        <video
                            ref={remoteRef}
                            autoPlay
                            playsInline
                            className={`w-full h-full object-cover ${isLocalExpanded ? 'rounded-lg sm:rounded-xl' : ''}`}
                        />

                        {/* Dark overlay for better UI visibility - only when fullscreen */}
                        {!isLocalExpanded && (
                            <div className="absolute inset-0 bg-black/20 z-10"></div>
                        )}

                        {/* Remote video label when minimized */}
                        {isLocalExpanded && (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg sm:rounded-xl pointer-events-none"></div>
                                <div className="absolute bottom-1 left-1 right-1 text-center">
                                    <span className="text-xs font-medium text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        {callReceiverFullname2?.name ? callReceiverFullname2.name : callerName.callerFullname}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Mute indicator overlay */}
                        {isRemoteMuted && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-red-500/80 text-white px-3 py-2 rounded-full backdrop-blur-sm flex items-center space-x-2">
                                    <VolumeX className="w-4 h-4" />
                                    <span className="text-sm font-medium">Muted</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top overlay - Call info */}
                    <div className={`absolute top-0 left-0 right-0 p-4 sm:p-6 ${isLocalExpanded ? 'z-50' : 'z-30'}`}>
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
                                        {isRemoteMuted && (
                                            <>
                                                <span>•</span>
                                                <VolumeX className="w-3 h-3 text-red-400" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Local video - Can be minimized, normal, or expanded to fullscreen */}
                    <div
                        className={`absolute transition-all duration-500 ease-in-out ${isLocalMinimized
                                ? 'top-4 left-4 w-14 h-14 sm:w-18 sm:h-18 z-40 cursor-pointer'
                                : isLocalExpanded
                                    ? 'inset-0 w-full h-full z-30 cursor-pointer'
                                    : 'top-20 right-4 sm:top-24 sm:right-6 w-32 h-24 sm:w-40 sm:h-28 md:w-48 md:h-32 lg:w-56 lg:h-36 xl:w-64 xl:h-40 z-40 cursor-pointer'
                            } ${isLocalDragging ? 'cursor-move' : ''}`}
                        onClick={toggleLocalVideo}
                    >
                        <video
                            ref={localRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover shadow-2xl backdrop-blur-sm transition-all duration-500 scale-x-[-1] ${isLocalMinimized
                                    ? 'rounded-full border-2 border-white/30'
                                    : isLocalExpanded
                                        ? 'rounded-none border-none'
                                        : 'rounded-lg sm:rounded-xl border-2 border-white/30'
                                }`}
                        />

                        {/* Video labels and overlays */}
                        {!isLocalMinimized && (
                            <>
                                <div className={`absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none ${isLocalExpanded ? '' : 'rounded-lg sm:rounded-xl'
                                    }`}></div>
                                <div className={`absolute ${isLocalExpanded ? 'bottom-4 left-4' : 'bottom-1 left-1 right-1'} text-center`}>
                                    <span className="text-xs font-medium text-white bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                        You
                                    </span>
                                </div>

                                {/* Expand/minimize hint */}
                                {!isLocalExpanded && (
                                    <div className="absolute top-1 right-1">
                                        <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                            <Maximize2 className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Control buttons at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 pb-8 sm:pb-12 px-4">
                        {/* Control buttons row */}
                        <div className="flex justify-center items-center space-x-4 mb-6">
                            {/* Audio Output Toggle Button - Only show on mobile */}
                            {isMobile && 'setSinkId' in (remoteRef.current || {}) && (
                                <button
                                    onClick={toggleAudioOutput}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 backdrop-blur-sm text-white rounded-full shadow-lg border border-white/20
                                             focus:outline-none focus:ring-4 focus:ring-white/30 
                                             transition-all duration-200 hover:scale-105 active:scale-95 
                                             flex items-center justify-center ${audioOutput === 'earpiece'
                                            ? 'bg-blue-500/80 hover:bg-blue-600/80 active:bg-blue-700/80'
                                            : 'bg-white/20 hover:bg-white/30 active:bg-white/40'
                                        }`}
                                    title={audioOutput === 'earpiece' ? "Switch to Speaker" : "Switch to Earpiece"}
                                >
                                    {audioOutput === 'earpiece' ? (
                                        <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
                                    ) : (
                                        <Speaker className="w-6 h-6 sm:w-7 sm:h-7" />
                                    )}
                                </button>
                            )}

                            {/* Camera Toggle Button - Only show on mobile devices with camera support */}
                            {isMobile && (
                                <button
                                    onClick={toggleCameraMode}
                                    className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 hover:bg-white/30 active:bg-white/40 
                                             backdrop-blur-sm text-white rounded-full shadow-lg border border-white/20
                                             focus:outline-none focus:ring-4 focus:ring-white/30 
                                             transition-all duration-200 hover:scale-105 active:scale-95 
                                             flex items-center justify-center"
                                    title="Switch Camera"
                                >
                                    <SwitchCamera className="w-6 h-6 sm:w-7 sm:h-7" />
                                </button>
                            )}

                            {/* Remote Mute/Unmute Button */}
                            <button
                                onClick={toggleRemoteMute}
                                className={`w-14 h-14 sm:w-16 sm:h-16 backdrop-blur-sm text-white rounded-full shadow-lg border border-white/20
                                         focus:outline-none focus:ring-4 focus:ring-white/30 
                                         transition-all duration-200 hover:scale-105 active:scale-95 
                                         flex items-center justify-center ${isRemoteMuted
                                        ? 'bg-red-500/80 hover:bg-red-600/80 active:bg-red-700/80'
                                        : 'bg-white/20 hover:bg-white/30 active:bg-white/40'
                                    }`}
                                title={isRemoteMuted ? "Unmute Remote Audio" : "Mute Remote Audio"}
                            >
                                {isRemoteMuted ? (
                                    <VolumeX className="w-6 h-6 sm:w-7 sm:h-7" />
                                ) : (
                                    <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                                )}
                            </button>
                        </div>

                        {/* End Call Button - Bottom center */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleEndCall}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                                title="End Call"
                            >
                                <PhoneOff className="w-6 h-6 sm:w-8 sm:h-8" />
                            </button>
                        </div>

                        {/* Connection indicator */}
                        <div className="flex items-center justify-center mt-4 text-white/80">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
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
                        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-green-400/60 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 relative">
                            <img
                                src={callReceiverFullname2?.name ? callReceiverProfilePic : callerProfilePic}
                                alt={callerName.callerFullname}
                                className="w-full h-full object-cover"
                            />
                            {/* Mute overlay on profile picture */}
                            {isRemoteMuted && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                    <VolumeX className="w-8 h-8 sm:w-12 sm:h-12 text-red-400" />
                                </div>
                            )}
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
                                {isRemoteMuted && (
                                    <>
                                        <span className="text-white/60">•</span>
                                        <span className="text-red-400 text-sm">Muted</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hidden audio elements */}
                        <video ref={remoteRef} autoPlay playsInline className="hidden" />
                        <video ref={localRef} autoPlay playsInline muted className="hidden" />
                    </div>

                    {/* Control buttons for Audio Call */}
                    <div className="absolute bottom-0 left-0 right-0 z-50 pb-8 sm:pb-12 px-4">
                        {/* Audio Output and Mute Button for Audio Call */}
                        <div className="flex justify-center items-center space-x-4 mb-6">
                            {/* Audio Output Toggle Button - Only show on mobile */}
                            {isMobile && 'setSinkId' in (remoteRef.current || {}) && (
                                <button
                                    onClick={toggleAudioOutput}
                                    className={`w-14 h-14 sm:w-16 sm:h-16 backdrop-blur-sm text-white rounded-full shadow-lg border border-white/20
                                             focus:outline-none focus:ring-4 focus:ring-white/30 
                                             transition-all duration-200 hover:scale-105 active:scale-95 
                                             flex items-center justify-center ${audioOutput === 'earpiece'
                                            ? 'bg-blue-500/80 hover:bg-blue-600/80 active:bg-blue-700/80'
                                            : 'bg-white/20 hover:bg-white/30 active:bg-white/40'
                                        }`}
                                    title={audioOutput === 'earpiece' ? "Switch to Speaker" : "Switch to Earpiece"}
                                >
                                    {audioOutput === 'earpiece' ? (
                                        <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
                                    ) : (
                                        <Speaker className="w-6 h-6 sm:w-7 sm:h-7" />
                                    )}
                                </button>
                            )}

                            {/* Remote Mute Button for Audio Call */}
                            <button
                                onClick={toggleRemoteMute}
                                className={`w-14 h-14 sm:w-16 sm:h-16 backdrop-blur-sm text-white rounded-full shadow-lg border border-white/20
                                         focus:outline-none focus:ring-4 focus:ring-white/30 
                                         transition-all duration-200 hover:scale-105 active:scale-95 
                                         flex items-center justify-center ${isRemoteMuted
                                        ? 'bg-red-500/80 hover:bg-red-600/80 active:bg-red-700/80'
                                        : 'bg-white/20 hover:bg-white/30 active:bg-white/40'
                                    }`}
                                title={isRemoteMuted ? "Unmute Remote Audio" : "Mute Remote Audio"}
                            >
                                {isRemoteMuted ? (
                                    <VolumeX className="w-6 h-6 sm:w-7 sm:h-7" />
                                ) : (
                                    <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                                )}
                            </button>
                        </div>

                        {/* End Call Button for Audio */}
                        <div className="flex justify-center">
                            <button
                                onClick={handleEndCall}
                                className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full shadow-2xl focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
                                title="End Call"
                            >
                                <PhoneOff className="w-6 h-6 sm:w-8 sm:h-8" />
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