import React, { createContext, useContext, useState } from "react";

const BlockContext = createContext();

export const BlockProvider = ({ children }) => {
    // Array to store blocked caller IDs
    const [blockedCallers, setBlockedCallers] = useState([]);

    // Add a caller ID to blocked list (only if not already added)
    const blockCaller = (callerId) => {
        setBlockedCallers(prev => {
            if (!prev.includes(callerId)) return [...prev, callerId];
            return prev; // already blocked, do nothing
        });
    };

    // Check if a caller is blocked
    const isBlocked = (callerId) => blockedCallers.includes(callerId);

    return (
        <BlockContext.Provider value={{ blockedCallers, blockCaller, isBlocked }}>
            {children}
        </BlockContext.Provider>
    );
};

// Custom hook to use the context
export const useBlock = () => useContext(BlockContext);
