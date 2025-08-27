'use client'

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import VideoDisplay from "./VideoDisplay";
import { useBlock } from "../../context/BlockedCallContext";
import { useProfile } from "../../context/ProfileContext";

const ManualSDPWebRTC = forwardRef(({ receiver, socket }, ref) => {
    // const localVideoRef = useRef(null)
    // const remoteVideoRef = useRef(null)
    // const pc = useRef(null)



    const [pendingOffer, setPendingOffer] = useState(null);
    const { isBlocked } = useBlock();
    const { profilePic } = useProfile();



    const { username } = useAuth();
    const { setIncomingCall, callAccepted, showVideo, setCallerUsername, setCallerFullname, localVideoRef2, callID, setCallID, remoteVideoRef2, localVideoRefForOutgoing,
        setIsAudioCall, currentIsVideo, setCurrentIsVideo, setCallerProfilePic, setCallReceiverProfilePic, callReceiverFullname, setCallReceiverFullname2, pc, cameraMode, toggleCameraMode } = useCall();
        // make a state for that callReceiverProfilePi
    useImperativeHandle(ref, () => ({
        createOffer,
        // cleanupMedia,
    }));

    const startLocalStream = async (isVideoCall = true) => {
        try {
            setIsAudioCall(!isVideoCall);
            const constraints = isVideoCall
                ? { video: true, audio: true }   
                : { video: false, audio: true }
            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            // if (localVideoRef.current) localVideoRef.current.srcObject = stream

            if (localVideoRef2?.current) {
                localVideoRef2.current.srcObject = stream;

            }

            if (localVideoRefForOutgoing?.current) {
                localVideoRefForOutgoing.current.srcObject = stream;

            }


            return stream
        } catch (err) {
            console.error("❌ Error accessing camera/mic:", err);
            alert('Error accessing camera/mic: ' + err.message)
            throw err
        }
    }
    const switchCamera = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: cameraMode }, 
                audio: true,
            });

            // Update local video preview
            if (localVideoRef2.current) {
                localVideoRef2.current.srcObject = newStream;
            }
            if (localVideoRefForOutgoing.current) {
                localVideoRefForOutgoing.current.srcObject = newStream;
            }

            // Replace track in PeerConnection
            const videoTrack = newStream.getVideoTracks()[0];
            const senders = pc.current?.getSenders() || [];
            const videoSender = senders.find(s => s.track && s.track.kind === "video");
            if (videoSender && videoTrack) {
                await videoSender.replaceTrack(videoTrack);
            }

            // Stop old tracks (free camera)
            if (localVideoRef2.current?.srcObject) {
                localVideoRef2.current.srcObject.getVideoTracks().forEach(t => {
                    if (t !== videoTrack) t.stop();
                });
            }

            console.log("✅ Camera switched");

        } catch (err) {
            console.error("❌ Error switching camera:", err);
        }
    };

    useEffect(() => {
        if (currentIsVideo) {
            switchCamera();
        }
    }, [cameraMode]);


    // const cleanupMedia = () => {

    //     // Stop all local tracks
    //     if (localVideoRef2.current?.srcObject) {
    //         localVideoRef2.current.srcObject.getTracks().forEach(track => track.stop());
    //         localVideoRef2.current.srcObject = null;
    //     }
    //     if (localVideoRefForOutgoing.current?.srcObject) {
    //         localVideoRefForOutgoing.current.srcObject.getTracks().forEach(track => track.stop());
    //         localVideoRefForOutgoing.current.srcObject = null;
    //     }

    //     // Stop all remote tracks
    //     if (remoteVideoRef2.current?.srcObject) {
    //         remoteVideoRef2.current.srcObject.getTracks().forEach(track => track.stop());
    //         // remoteVideoRef.current.srcObject = null;
    //         remoteVideoRef2.current.srcObject = null;
    //     }

    //     // Close PeerConnection
    //     if (pc.current) {
    //         pc.current.close();
    //         pc.current = null;
    //     }


    // };


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
                    {
                        urls: ["stun:ss-turn1.xirsys.com"],
                    },
                    {
                        username: "UlsB5adXbjcdyp7hLtFAI3ms4mCkN8axoldDl4kl4DuZ3hMeztsRUlQLwlfNyzhRAAAAAGivK2hzYWxpbWVnMTAw",
                        credential: "d4c71692-835e-11f0-a502-0242ac140004",
                        urls: [
                            "turn:ss-turn1.xirsys.com:80?transport=udp",
                            "turn:ss-turn1.xirsys.com:3478?transport=udp",
                            "turn:ss-turn1.xirsys.com:80?transport=tcp",
                            "turn:ss-turn1.xirsys.com:3478?transport=tcp",
                            "turns:ss-turn1.xirsys.com:443?transport=tcp",
                            "turns:ss-turn1.xirsys.com:5349?transport=tcp",
                        ],
                    },
                ],
            });
        }


            pc.current.ontrack = e => {
                const stream = e.streams[0];
                // if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== stream) {
                //     remoteVideoRef.current.srcObject = stream;
                // }
                if (remoteVideoRef2.current && remoteVideoRef2.current.srcObject !== stream) {
                    remoteVideoRef2.current.srcObject = stream;
                }
             
            };

        }
        return pc.current;
    };
    const createOffer = async (isVideoCall = true) => {
        // setOfferCreated(true)
        const callId = crypto.randomUUID();
        setCallID(callId)
        setCurrentIsVideo(isVideoCall);  // store locally

        // setShowVideo(true)
        const connection = createPeerConnection()
        const stream = await startLocalStream(isVideoCall)
        stream.getTracks().forEach(track => connection.addTrack(track, stream))

        const offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        await waitForIceGatheringComplete(connection)

        const localSDPString = JSON.stringify(connection.localDescription)
        // setLocalSDP(localSDPString)

        // Send offer via Socket.IO
        socket.emit("sendOffer", {
            callID: callId,
            sender: username,          // your current username
            receiver: receiver, // selected receiver username
            sdp: localSDPString ,
            isVideoCall,
            profilePic

        })
    }
    // Inside your component, use useEffect to listen once socket is available

    // const [incomingCall, setIncomingCall] = useState(false);

    useEffect(() => {
        if (!socket) return;

        socket.on("incoming-call", ({ sender, sdp, senderFullname, callID, isVideoCall, profilePic }) => {
            console.log("Incoming call from:", sender);
            if (!isBlocked(callID)) {
                setIncomingCall(true);
                setCallerFullname({
                    callerFullname: senderFullname,
                    callerUsername: sender
                });
                setCallerProfilePic(profilePic)
                setPendingOffer({ sender, sdp, isVideoCall }); // store temporarily
                setCurrentIsVideo(isVideoCall);
              

            }
        });

        return () => socket.off("incoming-call");
    }, [socket, callID, isBlocked]);

    // When user accepts the call
    useEffect(() => {
        if (callAccepted && pendingOffer) {
            console.log("User accepted, setting remote SDP now...");

            const startCall = async () => {
                const connection = createPeerConnection();

                const stream = await startLocalStream(pendingOffer.isVideoCall);
                stream.getTracks().forEach(track =>
                    connection.addTrack(track, stream)
                );

                const remoteDesc = new RTCSessionDescription(
                    JSON.parse(pendingOffer.sdp)
                );
                await connection.setRemoteDescription(remoteDesc);

                const answer = await connection.createAnswer();
                await connection.setLocalDescription(answer);
                await waitForIceGatheringComplete(connection);

                const localSDPString = JSON.stringify(connection.localDescription);

                socket.emit("sendAnswer", {
                    sender: username,
                    receiver: pendingOffer.sender,
                    sdp: localSDPString,
                    profilePic: profilePic,
                    callReceiverFullname: callReceiverFullname

                });

                setPendingOffer(null); // clear after use
            };

            startCall();
        }
    }, [callAccepted, pendingOffer, profilePic]);




    useEffect(() => {
        if (!socket) return;


        // Listen for the answer from the receiver
        socket.on("answer-received", async ({ sdp, sender, receiver, isVideoCall, profilePic, callReceiverFullname }) => {
            console.log('Answer received:', sdp);
            setCallReceiverProfilePic(profilePic)
            setCallReceiverFullname2(callReceiverFullname)
            if (!pc.current) return;

            try {
                const remoteDesc = new RTCSessionDescription(JSON.parse(sdp));
                await pc.current.setRemoteDescription(remoteDesc);
                console.log("Answer SDP set automatically!");

            } catch (err) {
                console.error("Failed to set remote SDP:", err);
            }
        });


        return () => socket.off("answer-received");
    }, [socket, callReceiverFullname, setCallReceiverProfilePic, pc,setCallReceiverFullname2]);



    return null;

})

export default ManualSDPWebRTC;