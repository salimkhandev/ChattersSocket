import React, { useEffect, useState } from "react";
import { useCall } from "../../context/CallContext";

export default function CallRingtone() {
    const [audio, setAudio] = useState(null);
    const [canPlaySound, setCanPlaySound] = useState(false);
    const { incomingCall } = useCall();

    // Step 1: Prepare audio once
    useEffect(() => {
        const sound = new Audio("/notification/incoming-call.mp3");
        sound.loop = true;
        setAudio(sound);
    }, []);

    // Step 2: Enable sound only after user interaction
    useEffect(() => {
        const enableSound = () => {
            setCanPlaySound(true);
            window.removeEventListener("click", enableSound);
            window.removeEventListener("keydown", enableSound);
            console.log("✅ User interaction unlocked audio");
        };

        window.addEventListener("click", enableSound);
        window.addEventListener("keydown", enableSound);

        return () => {
            window.removeEventListener("click", enableSound);
            window.removeEventListener("keydown", enableSound);
        };
    }, []);

    // Step 3: Play / stop ringtone on incoming call
    useEffect(() => {
        if (!audio) return;

        if (incomingCall && canPlaySound) {
            audio.play().catch((err) => {
                console.warn("🚫 Autoplay blocked:", err);
            });
        } else {
            audio.pause();
            audio.currentTime = 0; // reset position
        }
    }, [incomingCall, canPlaySound, audio]);

    return null;
}
