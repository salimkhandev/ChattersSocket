// context/UploadContext.jsx
'use client';
import React, { createContext, useContext, useRef } from 'react';

const UploadContext = createContext();

export const UploadProvider = ({ children }) => {
    const uploadFnRef = useRef(null);

    const registerUploadFn = (fn) => {
        uploadFnRef.current = fn;
    };

    const callUploadFn = () => {
        if (uploadFnRef.current) {
            uploadFnRef.current();
            
        } else {
            console.warn("Upload function not registered");
        }
    };

    return (
        <UploadContext.Provider value={{ registerUploadFn, callUploadFn }}>
            {children}
        </UploadContext.Provider>
    );
};

export const useUpload = () => useContext(UploadContext);
