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

createRoot(document.getElementById('root')).render(
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
);
