// context/AuthContext.js
// "use client";
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [username, setUsername] = useState();
    const [id, setId] = useState();
    const [socket, setSocket] = useState();
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    return (
        <AuthContext.Provider value={{ username, setUsername, id, setId,socket, setSocket, isLoggedIn, setIsLoggedIn, checkingAuth, setCheckingAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
