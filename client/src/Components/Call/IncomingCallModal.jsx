import React, { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

export default function CallHandler({ socket }) {
    const [incomingCall, setIncomingCall] = useState(null);
    const [inCall, setInCall] = useState(false);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);

    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    // Create PeerConnection if not exists
    const createPeerConnection = () => {
        if (pcRef.current) return pcRef.current; // reuse if exists

        const pc = new RTCPeerConnection();

        pc.onicecandidate = (event) => {
            if (event.candidate && incomingCall?.from) {
                socket.emit("ice-candidate", {
                    to: incomingCall.from,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // Debug connection state
        pc.onconnectionstatechange = () => {
            console.log("Peer connection state:", pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
        };

        pcRef.current = pc;
        return pc;
    };

    // Start local stream and add tracks to pc
    const startLocalStream = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }

        // Add tracks to existing pc
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
        });
    };

    const handleAccept = async () => {
        createPeerConnection(); // Make sure pc exists first
        await startLocalStream(); // then start stream and add tracks

        await pcRef.current.setRemoteDescription(
            new RTCSessionDescription(incomingCall.sdp)
        );

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);

        socket.emit("answer-call", { to: incomingCall.from, sdp: answer });

        setIncomingCall(null);
        setInCall(true);
    };

    const handleReject = () => {
        socket.emit("call-rejected", { to: incomingCall.from });
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }
        setInCall(false);
    };

    useEffect(() => {
        socket.on("incoming-call", ({ senderFullname, sdp, from }) => {
            setIncomingCall({ senderFullname, sdp, from });
        });

        socket.on("ice-candidate", async ({ candidate }) => {
            if (pcRef.current && candidate) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error("Error adding ICE candidate:", e);
                }
            }
        });

        socket.on("call-answered", async ({ sdp }) => {
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                setInCall(true);
            }
        });

        socket.on("call-rejected", () => {
            alert("Call rejected by remote user");
            setIncomingCall(null);
            setInCall(false);
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop());
                localStreamRef.current = null;
            }
        });

        return () => {
            socket.off("incoming-call");
            socket.off("ice-candidate");
            socket.off("call-answered");
            socket.off("call-rejected");
        };
    }, [socket]);

    if (incomingCall && !inCall) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl border border-gray-200">
                    {/* Videos */}
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

                    {/* Ripple Animation Icon */}
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

                    {/* Buttons */}
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
                />
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-80 h-60 bg-black rounded-lg mb-4"
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
