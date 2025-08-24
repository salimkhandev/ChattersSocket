// context/ProfileContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
const backendURL = import.meta.env.VITE_BACKEND_URL;

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const { username } = useAuth();
    const [profilePic, setProfilePic] = useState(null);

    const fetchProfilePic = async () => {
        try {
            const res = await fetch(`${backendURL}/get-profile-pic/${username}`);
            const data = await res.json();
            setProfilePic(data?.profilePicUrl || null);
        } catch (err) {
            console.error("Error fetching profile picture:", err);
        }
    };

    useEffect(() => {
        if (username) fetchProfilePic();
    }, [username]);

    return (
        <ProfileContext.Provider value={{ profilePic,setProfilePic }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => useContext(ProfileContext);
