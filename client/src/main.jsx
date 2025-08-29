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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('Service Worker registered ✅', reg))
    .catch(err => console.log('Service Worker registration failed ❌', err));}
// Add this to your app's root component or audio manager
const unlockAudioContext = async () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    await audioContext.resume();
    audioContext.close();
  } catch (error) {
    console.log('Audio unlock failed:', error);
  }
};

// Call this on any user interaction (tap, scroll, etc.)
<StrictMode>
    <BlockProvider>
    <CallProvider>
    <UploadProvider>
        <MediaProvider>
        <AuthProvider>
    < ProfileProvider>
      <VoiceProvider>
          <App />
      </VoiceProvider>  
    </ ProfileProvider>
        </AuthProvider>
        </MediaProvider>
    </UploadProvider>
      </CallProvider>
    </BlockProvider>
  </StrictMode>
document.addEventListener('touchstart', unlockAudioContext, { once: true });
 createRoot(document.getElementById('root')).render(
);
