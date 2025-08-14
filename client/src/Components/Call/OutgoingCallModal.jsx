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
    const localModalVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const { username } = useAuth();

    const iceCandidateQueue = useRef([]);

    useEffect(() => {

        socket.on("call-answered", async ({ sdp }) => {
            if (pc.current) {
                try {
                    console.log("Received answer SDP:", sdp);
                    let sdpAnswer = typeof sdp === 'string' ? JSON.parse(sdp) : sdp;
                    const remoteDesc = new RTCSessionDescription(sdpAnswer);
                    await pc.current.setRemoteDescription(remoteDesc);
                    setIsCalling(false);
                    setInCall(true);

                    // Add any queued ICE candidates after remote description is set
                    iceCandidateQueue.current.forEach(async candidate => {
                        try {
                            await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (e) {
                            console.error("Error adding queued ICE candidate:", e);
                        }
                    });
                    iceCandidateQueue.current = []; // clear queue
                } catch (error) {
                    console.error("Error setting remote description:", error);
                }
            } else {
                console.warn("Peer connection not initialized when receiving answer");
            }
        });

        socket.on("ice-candidate", ({ candidate }) => {
            candidate = typeof candidate === 'string' ? JSON.parse(candidate) : candidate;
            if (pc.current && pc.current.remoteDescription) {
                pc.current.addIceCandidate(new RTCIceCandidate(candidate))
                    .catch(e => console.error("Error adding ICE candidate:", e));
            } else {
                // Queue the candidate if remote description not ready
                iceCandidateQueue.current.push(candidate);
                console.log("Queued ICE candidate, waiting for remote description", candidate);
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
        };
    }, [socket]);

    const createPeerConnection = () => {
        if (!pc.current) {
            const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
            pc.current = new RTCPeerConnection(configuration);

            pc.current.onicecandidate = (event) => {
                if (event.candidate && receiver) socket.emit("ice-candidate", { to: receiver, candidate: event.candidate });
            };

            pc.current.ontrack = (event) => {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
            };
        }
        return pc.current;
    };

    const startLocalStream = async () => {
        try {
            localStream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream.current;
            if (localModalVideoRef.current) localModalVideoRef.current.srcObject = localStream.current;
            localStream.current.getTracks().forEach(track => pc.current.addTrack(track, localStream.current));
        } catch (error) {
            console.error("Error getting user media:", error);
            alert("Failed to access camera/mic.");
        }
    };

    const startCall = async () => {

        setIsCalling(true);
        createPeerConnection();
        await startLocalStream();
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        await new Promise(resolve => {
            if (pc.current.iceGatheringState === 'complete') resolve();
            else pc.current.addEventListener('icegatheringstatechange', () => resolve(), { once: true });
        });
        socket.emit('username', { username });
        socket.emit('call-user', { to: receiver, from: username, sdp: { type: offer.type, sdp: offer.sdp } });
    };

    const cleanupCall = (ended = false) => {
        setIsCalling(false);
        setInCall(false);
        if (pc.current) pc.current.close();
        if (localStream.current) localStream.current.getTracks().forEach(track => track.stop());
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (localModalVideoRef.current) localModalVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        iceCandidateQueue.current = [];
        if (ended) socket.emit("call-rejected", { to: receiver });
    };

    return (
        <div className="p-6">
            {!inCall && !isCalling && (
                <button onClick={startCall} className="inline-flex items-center gap-2 text-blue-500 focus:outline-none shadow-md transition-colors">
                    <Video size={20} />
                </button>
            )}

            {isCalling && (
                <CallerModal calleeName={receiver} onCancel={() => cleanupCall()} localVideoRef={localModalVideoRef} />
            )}

            {inCall && (
                <div className="mt-6 flex flex-col items-center space-y-4">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-56 h-40 bg-black rounded-lg shadow-lg" style={{ objectFit: 'contain' }} />
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-56 h-40 bg-black rounded-lg shadow-lg" style={{ objectFit: 'contain' }} />
                    <div className="bg-gray-100 rounded-xl p-4 w-full max-w-md text-center shadow-md">
                        <p className="mb-4 text-lg">In Call with <span className="font-medium">{receiver}</span></p>
                        <button onClick={() => cleanupCall(true)} className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 rounded-lg focus:outline-none shadow-md transition-colors flex items-center gap-2 mx-auto">
                            <PhoneOff size={18} /> End Call
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
