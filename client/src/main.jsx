import { StrictMode } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ProfileProvider } from './context/ProfileContext';
import { VoiceProvider } from './context/VoiceContext';
import { AuthProvider } from './context/AuthContext';
import { MediaProvider } from './context/MediaContext';
import { UploadProvider } from './context/UploadContext';
import { CallProvider } from "./context/CallContext";
import { BlockProvider } from "./context/BlockedCallContext";
import App from './App';

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('Service Worker registered ✅', reg))
    .catch(err => console.log('Service Worker registration failed ❌', err));
}

// Audio context unlock for mobile devices
const unlockAudioContext = async () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    audioContext.close();
    console.log('Audio context unlocked for mobile');
  } catch (error) {
    console.log('Audio unlock failed:', error);
  }
};

// Setup audio unlock listeners for mobile
const setupAudioUnlock = () => {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];

  const unlockHandler = () => {
    unlockAudioContext();
    // Remove listeners after first interaction
    events.forEach(event => {
      document.removeEventListener(event, unlockHandler);
    });
  };

  // Add listeners for various user interactions
  events.forEach(event => {
    document.addEventListener(event, unlockHandler, { once: true });
  });
};

// Initialize audio unlock setup
setupAudioUnlock();

// Render the React app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BlockProvider>
      <CallProvider>
        <UploadProvider>
          <MediaProvider>
            <AuthProvider>
              <ProfileProvider>
                <VoiceProvider>
                  <App />
                </VoiceProvider>
              </ProfileProvider>
            </AuthProvider>
          </MediaProvider>
        </UploadProvider>
      </CallProvider>
    </BlockProvider>
  </StrictMode>
);