import { useEffect } from "react";

const PlaySoundButton = () => {
    useEffect(() => {
        setTimeout(() => {
            playSound()
            
        }, 3000);
    }, []);
    
    const playSound = () => {
        const notificationSound = new Audio("/notification/notification-sound-effect-372475.mp3");
        notificationSound.play().catch((err) => {
            console.error("Audio play failed:", err);
        });
    };

    return (
        <button
            onClick={playSound}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
            Play Sound
        </button>
    );
};

export default PlaySoundButton;
