// context/CameraContext.jsx
"use client";
import { createContext, useContext, useState } from "react";

const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
    const [cameraMode, setCameraMode] = useState("user"); // default: front camera

    const toggleCameraMode = () => {
        setCameraMode(prev => (prev === "user" ? "environment" : "user"));
    };

    return (
        <CameraContext.Provider value={{ cameraMode, toggleCameraMode }}>
            {children}
        </CameraContext.Provider>
    );
};

export const useCamera = () => useContext(CameraContext);
