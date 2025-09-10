"use client";

import React, { createContext, useContext, useState } from "react";

// create context
const OnlineUsersContext = createContext();

// provider component
export const OnlineUsersProvider = ({ children }) => {
    const [onlineUsers, setOnlineUsers] = useState([]); // store users as array of objects

    return (
        <OnlineUsersContext.Provider value={{ onlineUsers, setOnlineUsers }}>
            {children}
        </OnlineUsersContext.Provider>
    );
};

// custom hook
export const useOnlineUsers = () => useContext(OnlineUsersContext);
