import React, { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

export default function CallHandler({ socket }) {
    const [incomingCall, setIncomingCall] = useState(null);
    const [inCall, setInCall] = useState(false);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const lastReceivedOffer = useRef(null);

    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    // Create or reuse PeerConnection
    const createPeerConnection = () => {
        if (pcRef.current) return pcRef.current;

        // Add STUN servers for better connectivity
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        };
        
        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = (event) => {
            if (event.candidate && incomingCall?.from) {
                socket.emit("ice-candidate", {
                    to: incomingCall.from,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            console.log("Remote track received in incoming call:", event.streams);
            if (remoteVideoRef.current && event.streams && event.streams[0]) {
                console.log("Setting remote video stream in incoming call", event.streams[0].getTracks().map(t => t.kind + ":" + t.readyState));
                remoteVideoRef.current.srcObject = event.streams[0];
                
                // Force play to handle autoplay policy restrictions
                remoteVideoRef.current.play().catch(error => {
                    console.warn("Remote video autoplay failed:", error.message);
                    // Add a user interaction element if needed for autoplay policy
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log("Peer connection state:", pc.connectionState);
            
            // Handle connection failures
            if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                console.warn("Connection state is", pc.connectionState, "- attempting recovery");
                // Attempt to restart ICE if connection fails
                if (pc.restartIce) {
                    try {
                        pc.restartIce();
                        console.log("ICE restart attempted");
                    } catch (e) {
                        console.error("ICE restart failed:", e);
                    }
                }
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
            
            // Handle ICE connection failures
             if (pc.iceConnectionState === 'failed') {
                 console.warn("ICE connection failed - attempting to create new answer");
                 // Use the stored offer for reconnection if available
                 const offerToUse = lastReceivedOffer.current || incomingCall?.sdp;
                 
                 if (offerToUse) {
                     try {
                         // Ensure we have a proper RTCSessionDescription object
                         let offerDesc;
                         if (typeof offerToUse === 'string') {
                             try {
                                 offerDesc = new RTCSessionDescription(JSON.parse(offerToUse));
                             } catch (e) {
                                 offerDesc = new RTCSessionDescription(offerToUse);
                             }
                         } else {
                             offerDesc = new RTCSessionDescription(offerToUse);
                         }
                         
                         pc.setRemoteDescription(offerDesc)
                             .then(() => pc.createAnswer())
                             .then(answer => pc.setLocalDescription(answer))
                             .then(() => {
                                 // Send the new answer to restart ICE
                                 const plainAnswer = {
                                     type: pc.localDescription.type,
                                     sdp: pc.localDescription.sdp
                                 };
                                 socket.emit('answer-call', { to: incomingCall.from, sdp: plainAnswer });
                                 console.log("New answer sent for ICE restart");
                             })
                             .catch(e => console.error("Error creating new answer:", e));
                     } catch (e) {
                         console.error("Error during ICE restart process:", e);
                     }
                 } else {
                     console.error("No stored offer available for ICE restart");
                 }
             }
        };

        pcRef.current = pc;
        return pc;
    };

    // Accept incoming call
    const handleAccept = async () => {
        let stream;
        try {
            const pc = createPeerConnection();
            // Get local media stream with specific constraints for better compatibility
            try {
                stream =await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { ideal: 30 }
                    }, 
                    audio: true 
                });
                localStreamRef.current = stream;

                // Display local video
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                    console.log("Local video stream set", stream.getTracks().map(t => t.kind + ":" + t.readyState));
                    
                    // Force play to handle autoplay policy restrictions
                    localVideoRef.current.play().catch(error => {
                        console.warn("Local video autoplay failed:", error.message);
                    });
                }
            } catch (mediaError) {
                console.error("Error accessing media devices:", mediaError);
                alert("Failed to access camera and microphone. Please ensure they are connected and permissions are granted.");
                // Clean up and exit call process
                handleReject();
                return;
            }

            // Add tracks to peer connection
            stream.getTracks().forEach(track => {
                console.log("Adding track to peer connection:", track.kind);
                pc.addTrack(track, stream);
            });
            
            // Set remote description (the offer)
            console.log("Setting remote description:", incomingCall.sdp);
            
            // Ensure proper SDP format for cross-browser compatibility
            let sdpOffer = incomingCall.sdp;
            if (typeof sdpOffer === 'string') {
                try {
                    sdpOffer = JSON.parse(sdpOffer);
                } catch (e) {
                    console.log("SDP is already in object format or not valid JSON");
                }
            }
            
            await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
            
            // Create and set local description (the answer)
            const answer = await pc.createAnswer();
            console.log("Created answer:", answer);
            await pc.setLocalDescription(answer);
            
            // Wait for ICE gathering to complete
            await waitForIceGatheringComplete(pc);
            
            // Send answer to caller - ensure we're sending a plain object
            // that can be serialized properly across browsers
            const plainAnswer = {
                type: answer.type,
                sdp: answer.sdp
            };
            
            console.log("Sending answer:", plainAnswer);
            // Make sure we're sending the correct data to the server
            console.log("Sending answer to:", incomingCall.from);
            socket.emit("answer-call", { to: incomingCall.from, sdp: plainAnswer });
            
            // Add a debug log to confirm the call has been answered
            console.log("Call answered, waiting for connection to establish...");
            
            setIncomingCall(null);
            setInCall(true);
        } catch (error) {
            console.error("Error in handleAccept:", error);
        }
    };

    const handleReject = () => {
        socket.emit("call-rejected", { to: incomingCall.from });
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        console.log("Ending call and cleaning up resources");
        
        // Clean up peer connection
        if (pcRef.current) {
            try {
                // Close all data channels
                pcRef.current.getDataChannels?.().forEach(channel => channel.close());
            } catch (e) {
                console.warn("Error closing data channels:", e);
            }
            
            // Close the peer connection
            try {
                pcRef.current.close();
                console.log("Peer connection closed");
            } catch (e) {
                console.warn("Error closing peer connection:", e);
            }
            pcRef.current = null;
        }
        
        // Clean up media streams
        if (localStreamRef.current) {
            try {
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Stopped local track: ${track.kind}`);
                });
            } catch (e) {
                console.warn("Error stopping local tracks:", e);
            }
            localStreamRef.current = null;
        }
        
        // Reset video elements
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        
        // Reset state
        setInCall(false);
        
        console.log("Call ended and resources cleaned up");
    };

    // Handle incoming call events
    useEffect(() => {
        socket.on("incoming-call", ({ senderFullname, sdp, from }) => {
            setIncomingCall({ senderFullname, sdp, from });
            
            // Store the offer for potential reconnection attempts
            if (sdp) {
                lastReceivedOffer.current = sdp;
                console.log("Stored SDP offer for potential reconnection");
            }
        });

        return () => {
            socket.off("incoming-call");
        };
    }, [socket]);
    
    // Handle autoplay policy for remote video
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
    }, [inCall, remoteVideoRef.current?.srcObject]);
    
    // Handle ICE candidates
    useEffect(() => {
        socket.on("ice-candidate", async ({ candidate }) => {
            if (pcRef.current && candidate) {
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
                    await pcRef.current.addIceCandidate(iceCandidate);
                    console.log("ICE candidate added successfully");
                } catch (e) {
                    console.error("Error adding ICE candidate:", e);
                }
            } else {
                console.warn("Received ICE candidate but peer connection not ready");
            }
        });
        
        return () => {
            socket.off("ice-candidate");
        };
    }, [socket]);
    
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
    
    // Handle call answered
    useEffect(() => {
        socket.on("call-answered", async ({ sdp }) => {
            if (pcRef.current) {
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
                    await pcRef.current.setRemoteDescription(remoteDesc);
                    console.log("Remote description set successfully");
                    setInCall(true); // mark that call is active
                } catch (error) {
                    console.error("Error setting remote description:", error);
                }
            } else {
                console.error("Peer connection not initialized when receiving answer");
            }
        });
        
        return () => {
            socket.off("call-answered");
        };
    }, [socket]);
    
    // Handle call rejected
    useEffect(() => {
        socket.on("call-rejected", () => {
            alert("Call rejected by remote user");
            handleEndCall();
            setIncomingCall(null);
        });
        
        return () => {
            socket.off("call-rejected");
        };
    }, [socket, handleEndCall]);

    if (incomingCall && !inCall) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl border border-gray-200">
                    <div className="flex gap-4 justify-center mb-4">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-40 h-32 bg-black rounded-lg"
                        />
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-40 h-32 bg-black rounded-lg"
                        />
                    </div>

                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: "52px",
                                    height: "52px",
                                    borderRadius: "50%",
                                    border: "2px solid #60a5fa",
                                    transform: "translate(-50%, -50%)",
                                    animation: "smallPing 1.2s ease-out infinite",
                                }}
                            ></div>
                            <div className="bg-blue-500 text-white rounded-full p-3 shadow-lg relative z-10">
                                <Video size={26} />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800">Incoming Call</h2>
                    <p className="text-gray-500 mb-6">
                        {incomingCall.senderFullname} is calling you...
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={handleAccept}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg shadow-md"
                        >
                            <Phone size={18} /> Accept
                        </button>
                        <button
                            onClick={handleReject}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg shadow-md"
                        >
                            <PhoneOff size={18} /> Reject
                        </button>
                    </div>
                </div>

                <style>
                    {`
            @keyframes smallPing {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
                100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
            }
          `}
                </style>
            </div>
        );
    }

    if (inCall) {
        return (
            <div className="fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-50">
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-40 h-32 bg-black rounded-lg mb-4"
                    style={{ objectFit: 'contain' }}
                    onLoadedMetadata={() => {
                        console.log("Local video metadata loaded");
                        localVideoRef.current.play().catch(e => console.warn("Local play failed:", e));
                    }}
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-80 h-60 bg-black rounded-lg mb-4"
                    style={{ objectFit: 'contain' }}
                    onLoadedMetadata={() => {
                        console.log("Remote video metadata loaded");
                        remoteVideoRef.current.play().catch(e => console.warn("Remote play failed:", e));
                    }}
                />
                <button
                    onClick={handleEndCall}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                >
                    End Call
                </button>
            </div>
        );
    }

    return null;
}
