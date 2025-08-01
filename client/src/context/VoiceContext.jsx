"use client";
import { createContext, useContext, useMemo, useState } from "react";

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
    const [tempVoiceUrl, setTempVoiceUrl] = useState(null);
    const [tempUrlAudio, setTempUrlAudio] = useState(null);

    // ✅ Memoize the context value
    const value = useMemo(() => ({
        tempVoiceUrl,
        setTempVoiceUrl,
        tempUrlAudio,   
        setTempUrlAudio,
    }), [tempVoiceUrl, tempUrlAudio]);

    return (
        <VoiceContext.Provider value={value}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => useContext(VoiceContext);
