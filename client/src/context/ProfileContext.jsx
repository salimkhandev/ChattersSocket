// context/ProfileContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
    const { username } = useAuth();
    const [profilePic, setProfilePic] = useState(null);

    const fetchProfilePic = async () => {
        try {
            const res = await fetch(`http://localhost:3000/get-profile-pic/${username}`);
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
        <ProfileContext.Provider value={{ profilePic }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => useContext(ProfileContext);
