// context/CallContext.js
import React, { createContext, useState,useRef, useContext } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [showVideo, setShowVideo] = useState(false); // true when someone is calling
    const [incomingCall, setIncomingCall] = useState(false); // true when someone is calling
    const [callAccepted, setCallAccepted] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null); // optional: store caller name/id
    const [callerFullname, setCallerFullname] = useState({});
    const [callerUsername, setCallerUsername] = useState("");
    const [outGoingCall, setOutGoingCall] = useState(null);
    const [callID , setCallID] = useState([]);
    const [isAudioCall , setIsAudioCall] = useState();
    const [callerProfilePic, setCallerProfilePic] = useState(null);
    const [callReceiverProfilePic, setCallReceiverProfilePic] = useState(null)
    const [callReceiverFullname, setCallReceiverFullname] = useState({})
    const [callReceiverFullname2, setCallReceiverFullname2] = useState({})
    const pc = useRef(null)
    const [currentIsVideo, setCurrentIsVideo] = useState(false);
    // const [localStream, setLocalStream] = useState(null);
    const localVideoRef2 = useRef(null);
    const remoteVideoRef2 = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    const localVideoRefForOutgoing = useRef(null);
    const cleanupMedia = () => {

        // Stop all local tracks
        if (localVideoRef2.current?.srcObject) {
            localVideoRef2.current.srcObject.getTracks().forEach(track => track.stop());
            localVideoRef2.current.srcObject = null;
        }
        if (localVideoRefForOutgoing.current?.srcObject) {
            localVideoRefForOutgoing.current.srcObject.getTracks().forEach(track => track.stop());
            localVideoRefForOutgoing.current.srcObject = null;
        }

        // Stop all remote tracks
        if (remoteVideoRef2.current?.srcObject) {
            remoteVideoRef2.current.srcObject.getTracks().forEach(track => track.stop());
            // remoteVideoRef.current.srcObject = null;
            remoteVideoRef2.current.srcObject = null;
        }

        // Close PeerConnection
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }

        // Reset call state
        setIncomingCall(false);
        // setCallAccepted(false);
        setShowVideo(false);
        setOutGoingCall(false);

    };
    const receiveCall = (caller) => {
        setCallerInfo(caller);
        setIncomingCall(true);
        setCallAccepted(false);
    };

    const acceptCall = () => {
        setCallAccepted(true);
        // alert("Call accepted!");
        setIncomingCall(false);
    };

    const rejectCall = () => {
    setIncomingCall(true);
        setCallAccepted(false);
        setIncomingCall(false);
        // setCallerInfo(null);
        setShowVideo(false);
        setOutGoingCall(false); 
    };

    return (
        <CallContext.Provider value={{
            incomingCall,
            setIncomingCall,
            showVideo,
            setShowVideo,
            callAccepted,
            callerInfo,
            outGoingCall, 
            setOutGoingCall,
            receiveCall,
            acceptCall,
            callerFullname, 
            setCallerFullname,
            setCallAccepted,
            rejectCall,
            callID, 
            setCallID,
            isAudioCall,
            setIsAudioCall,
            localVideoRef2,
            remoteVideoRef2,
            currentIsVideo,
             setCurrentIsVideo,
            localVideoRefForOutgoing,
            callerProfilePic, 
            setCallerProfilePic,
            callerUsername,
             setCallerUsername,
            callReceiverProfilePic,
             setCallReceiverProfilePic,
             callReceiverFullname,
             setCallReceiverFullname,
            callReceiverFullname2, 
            setCallReceiverFullname2,
            cleanupMedia,
            pc,
            isConnected,
            setIsConnected
            
       
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
