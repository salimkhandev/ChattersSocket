// context/AuthContext.js
// "use client";
import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [username, setUsername] = useState();
    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    return (
        <AuthContext.Provider value={{ username, setUsername, isLoggedIn, setIsLoggedIn, checkingAuth, setCheckingAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
