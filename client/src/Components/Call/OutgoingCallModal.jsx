import React, { useState, useRef, useEffect } from 'react';
import { Video, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function CallerModal({ calleeName, onCancel, localVideoRef }) {
    return (
        <div className="fixed inset-0 bg-black/60 flex flex-col justify-center items-center z-50 space-y-4">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-56 h-40 bg-black rounded-lg shadow-lg" />
            <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl border border-gray-200">
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            width: '52px', height: '52px', borderRadius: '50%',
                            border: '2px solid #86efac',
                            transform: 'translate(-50%, -50%)',
                            animation: 'smallPing 1.2s ease-out infinite'
                        }}></div>
                        <div className="bg-green-500 text-white rounded-full p-3 shadow-lg relative z-10">
                            <Video size={26} />
                        </div>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Calling...</h2>
                <p className="text-gray-500 mb-6">Calling <span className="font-medium">{calleeName}</span></p>
                <button onClick={onCancel} className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg transition-colors shadow-md focus:outline-none">
                    <PhoneOff size={18} /> Cancel
                </button>
            </div>
            <style>{`
                @keyframes smallPing {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
                    100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default function CallerVideoCall({ socket, receiver }) {
    const [isCalling, setIsCalling] = useState(false);
    const [inCall, setInCall] = useState(false);
    const pc = useRef(null);
    const localStream = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const { username } = useAuth();

    useEffect(() => {
        // Handle the answer from the callee
        socket.on("call-answered", async ({ sdp }) => {
            if (pc.current) {
                try {
                    console.log("Received answer SDP:", sdp);
                    
                    // Ensure proper SDP format for cross-browser compatibility
                    let sdpAnswer = sdp;
                    if (typeof sdpAnswer === 'string') {
                        try {
                            sdpAnswer = JSON.parse(sdpAnswer);
                        } catch (e) {
                            console.log("SDP is already in object format or not valid JSON");
                        }
                    }
                    
                    // Validate SDP format
                    if (!sdpAnswer || !sdpAnswer.type || !sdpAnswer.sdp) {
                        console.error("Invalid SDP format:", sdpAnswer);
                        return;
                    }
                    
                    // Create a proper RTCSessionDescription object
                    const remoteDesc = new RTCSessionDescription(sdpAnswer);
                    await pc.current.setRemoteDescription(remoteDesc);
                    console.log("Remote description set successfully");
                    setIsCalling(false);
                    setInCall(true);
                } catch (error) {
                    console.error("Error setting remote description:", error);
                }
            } else {
                console.error("Peer connection not initialized when receiving answer");
            }
        });

        // Handle incoming ICE candidates
        socket.on("ice-candidate", async ({ candidate }) => {
            if (pc.current && candidate) {
                try {
                    // Ensure proper candidate format
                    if (typeof candidate === 'string') {
                        try {
                            candidate = JSON.parse(candidate);
                        } catch (e) {
                            console.log("Candidate is already in object format or not valid JSON");
                        }
                    }
                    
                    console.log("Adding ICE candidate:", candidate);
                    const iceCandidate = new RTCIceCandidate(candidate);
                    await pc.current.addIceCandidate(iceCandidate);
                    console.log("ICE candidate added successfully");
                } catch (e) {
                    console.error("Error adding ICE candidate:", e);
                }
            } else {
                console.warn("Received ICE candidate but peer connection not ready");
            }
        });


        socket.on("call-rejected", () => {
            alert("Call rejected by remote user");
            cleanupCall();
        });

        return () => {
            socket.off("call-answered");
            socket.off("ice-candidate");
            socket.off("call-rejected");
        }
    }, [socket]);

    const createPeerConnection = () => {
        if (!pc.current) {
            // Add STUN servers for better connectivity
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                ]
            };
            
            pc.current = new RTCPeerConnection(configuration);

            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log("ICE Candidate:", event.candidate.candidate);

                    // Check if it's from STUN (srflx type)
                    if (event.candidate.candidate.includes("srflx")) {
                        console.log("✅ STUN server returned a reflexive candidate:", event.candidate.candidate);
                    }
                }
                if (event.candidate && receiver) {
                    socket.emit("ice-candidate", {
                        to: receiver,
                        candidate: event.candidate,
                    });
                }
            };

            pc.current.ontrack = (event) => {
                console.log("Remote track received:", event.streams);
                if (remoteVideoRef.current && event.streams && event.streams[0]) {
                    console.log("Setting remote video stream", event.streams[0].getTracks().map(t => t.kind + ":" + t.readyState));
                    remoteVideoRef.current.srcObject = event.streams[0];
                    
                    // Force play to handle autoplay policy restrictions
                    remoteVideoRef.current.play().catch(error => {
                        console.warn("Remote video autoplay failed:", error.message);
                        // Add a user interaction element if needed for autoplay policy
                    });
                }
            };
            
            // Log connection state changes for debugging and handle reconnection
            pc.current.onconnectionstatechange = () => {
                console.log("Connection state:", pc.current.connectionState);
                
                // Handle connection failures
                if (pc.current.connectionState === 'failed' || pc.current.connectionState === 'disconnected') {
                    console.warn("Connection state is", pc.current.connectionState, "- attempting recovery");
                    // Attempt to restart ICE if connection fails
                    if (pc.current.restartIce) {
                        try {
                            pc.current.restartIce();
                            console.log("ICE restart attempted");
                        } catch (e) {
                            console.error("ICE restart failed:", e);
                        }
                    }
                }
            };
            
            pc.current.oniceconnectionstatechange = () => {
                console.log("ICE connection state:", pc.current.iceConnectionState);
                
                // Handle ICE connection failures
                if (pc.current.iceConnectionState === 'failed') {
                    console.warn("ICE connection failed - attempting to create new offer");
                    // Create a new offer to restart ICE
                    pc.current.createOffer({ iceRestart: true })
                        .then(offer => pc.current.setLocalDescription(offer))
                        .then(() => {
                            // Send the new offer to restart ICE
                            const plainOffer = {
                                type: pc.current.localDescription.type,
                                sdp: pc.current.localDescription.sdp
                            };
                            socket.emit('call-user', { to: receiver, from: username, sdp: plainOffer });
                            console.log("New offer sent for ICE restart");
                        })
                        .catch(e => console.error("Error creating new offer:", e));
                }
            };
        }
        return pc.current;
    };

    const startLocalStream = async () => {
        try {
            console.log("Getting user media...");
            localStream.current = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                }, 
                audio: true 
            });
            console.log("Got local stream:", localStream.current.getTracks().map(t => t.kind));
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream.current;
                console.log("Set local video source");
                
                // Force play to handle autoplay policy restrictions
                localVideoRef.current.play().catch(error => {
                    console.warn("Local video autoplay failed:", error.message);
                });
            }
            
            // Add each track to the peer connection
            localStream.current.getTracks().forEach(track => {
                console.log("Adding track to peer connection:", track.kind, track.readyState);
                pc.current.addTrack(track, localStream.current);
            });
        } catch (error) {
            console.error("Error getting user media:", error);
            alert("Failed to access camera and microphone. Please ensure they are connected and permissions are granted.");
        }
    };

    // Wait for ICE gathering to complete before sending SDP
    const waitForIceGatheringComplete = pc => { 
        return new Promise(resolve => {
            if (pc.iceGatheringState === 'complete') {
                resolve();
            } else {
                const timeout = setTimeout(() => {
                    pc.removeEventListener('icegatheringstatechange', checkState);
                    resolve();
                }, 5000); // 5 second timeout

                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        clearTimeout(timeout);
                        pc.removeEventListener('icegatheringstatechange', checkState);
                        resolve();
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState);
            }
        });
    };

    const startCall = async () => {
        try {
            setIsCalling(true);
            createPeerConnection();
            await startLocalStream();
            
            // Create offer
            console.log("Creating offer...");
            const offer = await pc.current.createOffer();
            console.log("Offer created:", offer);
            
            // Set local description
            await pc.current.setLocalDescription(offer);
            console.log("Local description set");
            
            // Wait for ICE gathering to complete
            await waitForIceGatheringComplete(pc.current);
            
            // Create a plain object version of the offer for cross-browser compatibility
            const plainOffer = {
                type: offer.type,
                sdp: offer.sdp
            };
            
            // Make sure the username is registered with the server before making the call
            // This ensures the socket ID is properly associated with the username
            socket.emit('username', { username });
            
            // Send offer to callee
            socket.emit('call-user', { to: receiver, from: username, sdp: plainOffer });
            console.log("Offer sent to:", receiver, "from:", username);
            console.log("Socket ID:", socket.id);
        } catch (error) {
            console.error("Error starting call:", error);
            setIsCalling(false);
        }
    };

    const cancelCall = () => cleanupCall();
    const endCall = () => cleanupCall(true);

    const cleanupCall = (ended = false) => {
        console.log("Cleaning up call resources");
        setIsCalling(false);
        setInCall(false);
        
        // Clean up peer connection
        if (pc.current) {
            try {
                // Close all data channels
                pc.current.getDataChannels?.().forEach(channel => channel.close());
            } catch (e) {
                console.warn("Error closing data channels:", e);
            }
            
            try {
                pc.current.close();
                console.log("Peer connection closed");
            } catch (e) {
                console.warn("Error closing peer connection:", e);
            }
            pc.current = null;
        }
        
        // Clean up media streams
        if (localStream.current) {
            try {
                localStream.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped local track: ${track.kind}`);
                });
            } catch (e) {
                console.warn("Error stopping local tracks:", e);
            }
            localStream.current = null;
        }
        
        // Reset video elements
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        
        if (ended) socket.emit("call-rejected", { to: receiver });
        console.log("Call resources cleaned up");
    };

    useEffect(() => {
        if (inCall && remoteVideoRef.current && remoteVideoRef.current.srcObject) {
            const playVideo = async () => {
                try {
                    await remoteVideoRef.current.play();
                    console.log("Remote video playback started successfully");
                } catch (e) {
                    console.warn("Autoplay failed due to browser policy:", e);
                    
                    // Create and show a play button overlay for user interaction
                    const playButton = document.createElement('button');
                    playButton.textContent = 'Click to Play Video';
                    playButton.style.position = 'absolute';
                    playButton.style.zIndex = '10';
                    playButton.style.top = '50%';
                    playButton.style.left = '50%';
                    playButton.style.transform = 'translate(-50%, -50%)';
                    playButton.style.padding = '10px 15px';
                    playButton.style.backgroundColor = '#4CAF50';
                    playButton.style.color = 'white';
                    playButton.style.border = 'none';
                    playButton.style.borderRadius = '5px';
                    playButton.style.cursor = 'pointer';
                    
                    // Add the button to the video container
                    const videoContainer = remoteVideoRef.current.parentElement;
                    if (videoContainer) {
                        videoContainer.style.position = 'relative';
                        videoContainer.appendChild(playButton);
                        
                        // Play video when button is clicked and remove the button
                        playButton.addEventListener('click', async () => {
                            try {
                                await remoteVideoRef.current.play();
                                console.log("Remote video playback started after user interaction");
                                videoContainer.removeChild(playButton);
                            } catch (err) {
                                console.error("Failed to play video after user interaction:", err);
                            }
                        });
                    }
                }
            };
            
            playVideo();
        }
    }, [inCall]);

    return (
        <div className="p-6">
            {!inCall && !isCalling && (
                <button onClick={startCall} className="inline-flex items-center gap-2 text-blue-500 focus:outline-none shadow-md transition-colors">
                    <Video size={20} />
                </button>
            )}

            {isCalling && (
                <CallerModal calleeName={receiver} onCancel={cancelCall} localVideoRef={localVideoRef} />
            )}

            {inCall && (
                <div className="mt-6 flex flex-col items-center space-y-4">
                    <video 
                        ref={localVideoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-56 h-40 bg-black rounded-lg shadow-lg" 
                        style={{ objectFit: 'contain' }}
                    />
                    <video 
                        ref={remoteVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-56 h-40 bg-black rounded-lg shadow-lg" 
                        style={{ objectFit: 'contain' }}
                        onLoadedMetadata={() => {
                            console.log("Remote video metadata loaded");
                            remoteVideoRef.current.play().catch(e => console.warn("Remote play failed:", e));
                        }}
                    />
                    <div className="bg-gray-100 rounded-xl p-4 w-full max-w-md text-center shadow-md">
                        <p className="mb-4 text-lg">In Call with <span className="font-medium">{receiver}</span></p>
                        <button onClick={endCall} className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg focus:outline-none shadow-md transition-colors flex items-center gap-2 mx-auto">
                            <PhoneOff size={18} /> End Call
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
