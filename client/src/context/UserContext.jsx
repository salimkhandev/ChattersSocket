// context/UserContext.js
"use client"
import { createContext, useContext, useState,useEffect } from "react";
import React from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [username, setUsername] = useState(localStorage.getItem("chat_user") || "");
    const [profilePic, setProfilePic] = useState(null);

    const fetchProfilePic = async () => {
        // try {
        //     const res = await fetch(`https://5dbb6c84-cb5e-4423-ba04-72e6a621809a-00-7sp7cj9ozrz2.spock.replit.dev/get-profile-pic/${username}`);
        //     const data = await res.json();
        //     setProfilePic(data?.profilePicUrl || null);
        // } catch (err) {
        //     console.error("Error fetching profile picture:", err);
        // }


        try {
            const res = await fetch(`http://localhost:3000/get-profile-pic/${username}`);
            const data = await res.json();
            setProfilePic(data?.profilePicUrl || null);
        } catch (err) {
            console.error("Error fetching profile picture:", err);
        }
    };
    useEffect(() => {


        fetchProfilePic();
    }, [username]);

    return (
        <UserContext.Provider value={{ username, setUsername,profilePic,setProfilePic }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
