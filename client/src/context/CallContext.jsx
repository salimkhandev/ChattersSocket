// context/CallContext.js
import React, { createContext, useState, useContext } from "react";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const [incomingCall, setIncomingCall] = useState(false); // true when someone is calling
    const [callAccepted, setCallAccepted] = useState(false);
    const [callerInfo, setCallerInfo] = useState(null); // optional: store caller name/id

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
        setCallAccepted(false);
        setIncomingCall(false);
        setCallerInfo(null);
    };

    return (
        <CallContext.Provider value={{
            incomingCall,
            setIncomingCall,
            callAccepted,
            callerInfo,
            receiveCall,
            acceptCall,
             setCallAccepted,
            rejectCall
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
