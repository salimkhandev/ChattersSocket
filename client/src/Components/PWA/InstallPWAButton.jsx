import React, { useState, useEffect } from "react";

const InstallPWAButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        const checkInstalled = () => {
            if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
                setIsInstalled(true);
            }
        };

        checkInstalled();

        // Listen for beforeinstallprompt (Android & desktop)
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault(); // prevent auto prompt
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        // Listen for appinstalled event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    // iOS install instructions (for Safari)
    const isiOS = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent) && !window.MSStream;
    };

    const handleInstall = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt(); // show native prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                console.log("User choice:", choiceResult.outcome);
                setDeferredPrompt(null);
            });
        }
    };

    if (isInstalled) return null; // hide button if already installed

    return (
        <div className="fixed bottom-20 right-5 z-50">
            {deferredPrompt ? (
                <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition-colors"
                >
                    Install App
                </button>
            ) : isiOS() ? (
                <div className="p-3 bg-gray-100 rounded-md shadow-md max-w-xs text-sm text-gray-800">
                    To install this app on iOS: Tap <span className="font-bold">Share</span> → <span className="font-bold">Add to Home Screen</span>
                </div>
            ) : null}
        </div>
    );
};

export default InstallPWAButton;
