// context/CallContext.js
import React, { createContext, useState,useRef, useContext } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [showVideo, setShowVideo] = useState(false); // true when someone is calling
    const [incomingCall, setIncomingCall] = useState(false); // true when someone is calling
    const [callAccepted, setCallAccepted] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null); // optional: store caller name/id
    const [callerFullname, setCallerFullname] = useState("");
    const [outGoingCall, setOutGoingCall] = useState(null);
    const [callID , setCallID] = useState([]);
    // const [localStream, setLocalStream] = useState(null);
    const localVideoRef2 = useRef(null);
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
            // localStream,
            //  setLocalStream,
            localVideoRef2
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
