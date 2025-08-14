'use client'

import React, { useRef, useState,useEffect } from 'react'
import { useAuth } from '../../context/AuthContext';

export default function ManualSDPWebRTC({receiver, socket}) {
    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)
    const pc = useRef(null)
    const [localSDP, setLocalSDP] = useState('')
    const [remoteSDP, setRemoteSDP] = useState('')
    const [offerCreated, setOfferCreated] = useState(false)
    const [answerCreated, setAnswerCreated] = useState(false)
    const [remoteSDPSet, setRemoteSDPSet] = useState(false)
    const { username } = useAuth();
    const startLocalStream = async () => {
        console.log("📹 Attempting to access local camera/mic...");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            if (localVideoRef.current) localVideoRef.current.srcObject = stream
            console.log("✅ Local stream started", stream);
            return stream
        } catch (err) {
            console.error("❌ Error accessing camera/mic:", err);
            alert('Error accessing camera/mic: ' + err.message)
            throw err
        }
    }

    const waitForIceGatheringComplete = pc => {
        return new Promise(resolve => {
            if (pc.iceGatheringState === 'complete') {
                resolve()
            } else {
                const timeout = setTimeout(() => {
                    pc.removeEventListener('icegatheringstatechange', checkState)
                    resolve()
                }, 5000)

                function checkState() {
                    if (pc.iceGatheringState === 'complete') {
                        clearTimeout(timeout)
                        pc.removeEventListener('icegatheringstatechange', checkState)
                        resolve()
                    }
                }
                pc.addEventListener('icegatheringstatechange', checkState)
            }
        })
    }

    const createPeerConnection = () => {
        if (!pc.current) {
            pc.current = new RTCPeerConnection({
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" },
                ],
            });

            pc.current.ontrack = e => {
                if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== e.streams[0]) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                }
            };
        }
        return pc.current;
    };
    const createOffer = async () => {
        setOfferCreated(true)

        const connection = createPeerConnection()
        const stream = await startLocalStream()
        stream.getTracks().forEach(track => connection.addTrack(track, stream))

        const offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        await waitForIceGatheringComplete(connection)

        const localSDPString = JSON.stringify(connection.localDescription)
        setLocalSDP(localSDPString)

        // Send offer via Socket.IO
        socket.emit("sendOffer", {
            sender: username,          // your current username
            receiver: receiver, // selected receiver username
            sdp: localSDPString
        })
    }
    // Inside your component, use useEffect to listen once socket is available
    useEffect(() => {
        if (!socket) return;

        socket.on("incoming-call", async ({ sender, sdp }) => {
            console.log("Incoming call from:", sender);

            // 1. Create or get peer connection
            const connection = createPeerConnection();

            // 2. Start local media
            const stream = await startLocalStream();
            stream.getTracks().forEach(track => connection.addTrack(track, stream));

            // 3. Set remote SDP (offer)
            const remoteDesc = new RTCSessionDescription(JSON.parse(sdp));
            await connection.setRemoteDescription(remoteDesc);

            // 4. Create answer
            const answer = await connection.createAnswer();
            await connection.setLocalDescription(answer);
            await waitForIceGatheringComplete(connection);

            // 5. Send answer back to caller
            const localSDPString = JSON.stringify(connection.localDescription);
            socket.emit("sendAnswer", {
                sender: username,    // receiver now
                receiver: sender,    // original caller
                sdp: localSDPString
            });

            // 6. Update state
            setLocalSDP(localSDPString);
            setRemoteSDP(sdp);
            setAnswerCreated(true);
        });

        // Cleanup
        return () => socket.off("incoming-call");
    }, [socket]);


    useEffect(() => {
        if (!socket) return;

        // Listen for the answer from the receiver
        socket.on("answer-received", async ({ sdp }) => {
            console.log('Answer received:', sdp);

            if (!pc.current) return;

            try {
                const remoteDesc = new RTCSessionDescription(JSON.parse(sdp));
                await pc.current.setRemoteDescription(remoteDesc);
                console.log("Answer SDP set automatically!");

                setRemoteSDPSet(true); // mark remote SDP applied
                setLocalSDP(JSON.stringify(pc.current.localDescription)); // update local SDP
            } catch (err) {
                console.error("Failed to set remote SDP:", err);
            }
        });

        return () => socket.off("answer-received");
    }, [socket]);



    return (
        <div className="flex flex-col gap-4 max-w-3xl w-full p-4 mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
                <button
                    onClick={createOffer}
                    disabled={offerCreated}
                    className={`flex-1 px-4 py-2 rounded text-white ${offerCreated ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    Call
                </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <div className="flex-1">
                    <h2 className="mb-2 font-semibold">Local Video</h2>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-12 max-w-sm sm:max-w-full h-auto aspect-video bg-black rounded"
                    />
                </div>
                <div className="flex-1">
                    <h2 className="mb-2 font-semibold">Remote Video</h2>
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-sm sm:max-w-full h-auto aspect-video bg-black rounded"
                    />
                </div>
            </div>
        </div>
    )
}
