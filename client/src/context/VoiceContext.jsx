"use client";
import { createContext, useContext, useMemo, useState, useRef } from "react";

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const [tempVoiceUrl, setTempVoiceUrl] = useState(null);
    const [tempUrlAudio, setTempUrlAudio] = useState(null);
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const intervalRef = useRef(null);

    // ✅ Memoize the context value
    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        setRecording(false);
    };
    const value = useMemo(() => ({
        tempVoiceUrl,
        setTempVoiceUrl,
        tempUrlAudio,   
        recording,
        setRecording,
        mediaRecorderRef,
        intervalRef,
        setTempUrlAudio,
        stopRecording,
    }), [tempVoiceUrl, tempUrlAudio, recording, mediaRecorderRef, intervalRef]);

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => useContext(VoiceContext);
