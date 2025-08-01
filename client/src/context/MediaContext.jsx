'use client';
import React, { createContext, useContext, useState } from 'react';

const MediaContext = createContext();

export const MediaProvider = ({ children }) => {
    const [localUrl, setLocalUrl] = useState(null);         // media blob or Cloudinary URL
    const [localFormat, setLocalFormat] = useState(null);   // e.g., webm, mp3, mp4, etc.
    const [uploading, setUploading] = useState(false);
    const [isModalOpen,setIsModalOpen]=useState(false)
    
    return (
        <MediaContext.Provider value={{ localUrl, setLocalUrl, uploading, setUploading, localFormat, isModalOpen, setIsModalOpen, setLocalFormat }}>
            {children}
        </MediaContext.Provider>
    );
};

export const useMedia = () => useContext(MediaContext);
