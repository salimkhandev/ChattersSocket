// context/globalWaveSurferManager.js

let currentWaveSurfer = null;
let listeners = [];

export function setCurrentWaveSurfer(newInstance) {
    if (
        currentWaveSurfer &&
        currentWaveSurfer !== newInstance &&
        currentWaveSurfer.isPlaying()
    ) {
        currentWaveSurfer.pause();
        notifyListeners(currentWaveSurfer, false); 
    }

    currentWaveSurfer = newInstance;
    notifyListeners(newInstance, true);
}

export function onWaveSurferChange(listener) {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
}

function notifyListeners(ws, isPlaying) {
    listeners.forEach(listener => listener(ws, isPlaying));
}
