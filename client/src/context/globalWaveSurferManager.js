// context/globalWaveSurferManager.js

let currentWaveSurfer = null;

export function setCurrentWaveSurfer(newInstance) {
    if (
        currentWaveSurfer &&
        currentWaveSurfer !== newInstance &&
        currentWaveSurfer.isPlaying()
    ) {
        currentWaveSurfer.pause();      // ⏸ Stop previous one
        // currentWaveSurfer.seekTo(0);    // ⏮ Optional: Reset to start
    }

    currentWaveSurfer = newInstance;
}
