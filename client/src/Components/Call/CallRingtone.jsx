import React, { useEffect, useState } from "react";
import { useCall } from "../../context/CallContext";

export default function CallRingtone() {
    const [canPlaySound, setCanPlaySound] = useState(false);
    const { incomingCall } = useCall();
    // suuget me code
    

    // Step 1: Capture any user interaction once
    useEffect(() => {
        const enableSound = () => {
            setCanPlaySound(true);
            window.removeEventListener("click", enableSound);
            console.log('User has interacted with the page')
        };
        window.addEventListener("click", enableSound);
        return () => window.removeEventListener("click", enableSound);
    }, []);

    // Step 2: Play ringtone only if user has interacted
    useEffect(() => {
        let audio;
        if (incomingCall && canPlaySound) {
            audio = new Audio("/notification/incoming-call.mp3");
            audio.loop = true;
            audio.play().catch(() => {
                console.warn("Autoplay blocked 😒 (no user action yet)");
            });
        }
        return () => {
            if (audio) {
                audio.pause();
                audio = null;
            }
        };
    }, [incomingCall, canPlaySound]);

    return null;
}
