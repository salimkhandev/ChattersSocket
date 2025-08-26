import React, { useEffect, useState, useRef } from "react";
import { useCall } from "../../context/CallContext";

export default function CallRingtone() {
    const [canPlaySound, setCanPlaySound] = useState(false);
    const { incomingCall } = useCall();
    const audioRef = useRef(null);
    const isPlayingRef = useRef(false);

    // Initialize audio and capture user interaction
    useEffect(() => {
        // Pre-load audio
        audioRef.current = new Audio("/notification/incoming-call.mp3");
        audioRef.current.loop = true;
        audioRef.current.preload = "auto";

        // Set volume (some browsers require this)
        audioRef.current.volume = 0.8;

        const enableSound = () => {
            setCanPlaySound(true);
            console.log('User interaction captured - audio enabled');

            // Test play a silent sound to "unlock" audio context
            if (audioRef.current && !canPlaySound) {
                audioRef.current.volume = 0;
                audioRef.current.play()
                    .then(() => {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        audioRef.current.volume = 0.8;
                        console.log('Audio context unlocked');
                    })
                    .catch(() => {
                        console.warn('Failed to unlock audio context');
                    });
            }
        };

        // Listen for multiple types of user interactions
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, enableSound, { once: true });
        });

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, enableSound);
            });
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [canPlaySound]);

    // Handle ringtone playback
    useEffect(() => {
        if (!audioRef.current) return;

        if (incomingCall && canPlaySound && !isPlayingRef.current) {
            // Reset audio to start
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.8;

            audioRef.current.play()
                .then(() => {
                    isPlayingRef.current = true;
                    console.log('Ringtone started playing');
                })
                .catch((error) => {
                    console.warn("Ringtone autoplay blocked:", error);
                    // Fallback: show visual notification or prompt user
                    showFallbackNotification();
                });
        } else if (!incomingCall && isPlayingRef.current) {
            // Stop ringtone
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            isPlayingRef.current = false;
            console.log('Ringtone stopped');
        }
    }, [incomingCall, canPlaySound]);

    // Fallback for when audio fails
    const showFallbackNotification = () => {
        // You can implement a visual notification here
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Call', {
                body: 'You have an incoming call',
                icon: '/icons/call-icon.png'
            });
        }
    };

    // Request notification permission on component mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return null;
}