import React, { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";

export default function CallHandler({ socket }) {
    const [incomingCall, setIncomingCall] = useState(null);
    const [inCall, setInCall] = useState(false);

    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const lastReceivedOffer = useRef(null);
    const iceCandidateQueue = useRef([]);

    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    const createPeerConnection = () => {
        if (pcRef.current) return pcRef.current;

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });

        pc.onicecandidate = (event) => {
            if (event.candidate && incomingCall?.from) {
                socket.emit("ice-candidate", {
                    to: incomingCall.from,
                    candidate: event.candidate,
                });
            }
        };

        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                remoteVideoRef.current.play().catch(() => { });
            }
        };

        pcRef.current = pc;
        return pc;
    };

    const handleAccept = async () => {
        if (!incomingCall) return;

        const pc = createPeerConnection();
        try {
            // Get local media
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            // Parse and set remote description
            let sdpOffer = incomingCall.sdp;
            if (typeof sdpOffer === 'string') sdpOffer = JSON.parse(sdpOffer);
            await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));

            // Add queued ICE candidates
            iceCandidateQueue.current.forEach(async c => {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
                catch (e) { console.error("Queued ICE candidate failed", e); }
            });
            iceCandidateQueue.current = [];

            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            // Wait ICE gathering
            await new Promise(resolve => {
                if (pc.iceGatheringState === "complete") resolve();
                else pc.addEventListener("icegatheringstatechange", () => resolve(), { once: true });
            });

            socket.emit("answer-call", { to: incomingCall.from, sdp: { type: answer.type, sdp: answer.sdp } });

            setIncomingCall(null);
            setInCall(true);
        } catch (error) {
            console.error("Error accepting call:", error);
            handleReject();
        }
    };

    const handleReject = () => {
        if (incomingCall?.from) socket.emit("call-rejected", { to: incomingCall.from });
        setIncomingCall(null);
    };

    const handleEndCall = () => {
        if (pcRef.current) pcRef.current.close();
        pcRef.current = null;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

        setInCall(false);
    };

    // Incoming call listener
    useEffect(() => {
        socket.on("incoming-call", ({ senderFullname, sdp, from }) => {
            setIncomingCall({ senderFullname, sdp, from });
            lastReceivedOffer.current = sdp;
        });
        return () => socket.off("incoming-call");
    }, [socket]);

    // ICE candidates listener
    useEffect(() => {
        socket.on("ice-candidate", async ({ candidate }) => {
            if (!candidate) return;

            if (typeof candidate === "string") {
                try { candidate = JSON.parse(candidate); } catch { }
            }

            if (pcRef.current && pcRef.current.remoteDescription) {
                try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
                catch (e) { console.error("Error adding ICE candidate:", e); }
            } else {
                iceCandidateQueue.current.push(candidate);
            }
        });
        return () => socket.off("ice-candidate");
    }, [socket]);

    // Call answered listener
    useEffect(() => {
        socket.on("call-answered", async ({ sdp }) => {
            if (!pcRef.current) return;

            if (typeof sdp === "string") sdp = JSON.parse(sdp);
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            setInCall(true);
        });
        return () => socket.off("call-answered");
    }, [socket]);

    // Call rejected listener
    useEffect(() => {
        socket.on("call-rejected", handleEndCall);
        return () => socket.off("call-rejected");
    }, [socket]);

    if (incomingCall && !inCall) {
        return (
            <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
                <div className="bg-white rounded-2xl p-6 w-96 text-center shadow-2xl">
                    <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
                    <p className="text-gray-500 mb-4">{incomingCall.senderFullname} is calling you...</p>
                    <div className="flex gap-3">
                        <button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Accept</button>
                        <button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg">Reject</button>
                    </div>
                </div>
            </div>
        );
    }

    if (inCall) {
        return (
            <div className="fixed inset-0 bg-black/80 flex flex-col justify-center items-center z-50">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-40 h-32 mb-2 bg-black rounded-lg" />
                <video ref={remoteVideoRef} autoPlay playsInline className="w-80 h-60 mb-2 bg-black rounded-lg" />
                <button onClick={handleEndCall} className="bg-red-600 text-white px-4 py-2 rounded">End Call</button>
            </div>
        );
    }

    return null;
}
