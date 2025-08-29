'use client';
import { Play, Square } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { setCurrentWaveSurfer } from '../../../context/globalWaveSurferManager';

export default function VoiceMessagePlayer({ audioUrl }) {
    const waveformRef = useRef(null);
    const waveSurferRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!waveformRef.current || !audioUrl) return;

        waveSurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#d1d5db',
            progressColor: '#3b82f6',
            cursorColor: '#000',
            height: 20,
            barWidth: 2,
            barGap: 1,
            barRadius: 3,
            responsive: true,
            // Mobile optimizations
            backend: 'WebAudio',
            mediaControls: false,
            normalize: true,
            pixelRatio: 1,
        });

        waveSurferRef.current.load(audioUrl);

        waveSurferRef.current.on('ready', () => {
            setIsLoading(false);
            setDuration(waveSurferRef.current.getDuration());
        });

        // More frequent updates for mobile
        waveSurferRef.current.on('audioprocess', () => {
            if (waveSurferRef.current.isPlaying()) {
                setCurrentTime(waveSurferRef.current.getCurrentTime());
            }
        });

        // Handle play state changes more reliably
        waveSurferRef.current.on('play', () => {
            setIsPlaying(true);
            // Start a timer to sync progress on mobile
            startProgressSync();
        });

        waveSurferRef.current.on('pause', () => {
            setIsPlaying(false);
            stopProgressSync();
        });

        waveSurferRef.current.on('interaction', () => {
            // Immediate update for seeking
            setCurrentTime(waveSurferRef.current.getCurrentTime());
        });

        waveSurferRef.current.on('finish', () => {
            setIsPlaying(false);
            setCurrentTime(waveSurferRef.current.getDuration());
            stopProgressSync();
        });

        return () => {
            stopProgressSync();
            if (waveSurferRef.current) {
                waveSurferRef.current.destroy();
            }
        };
    }, [audioUrl]);

    // Progress sync timer for mobile devices
    const progressTimerRef = useRef(null);

    const startProgressSync = () => {
        stopProgressSync(); // Clear any existing timer
        progressTimerRef.current = setInterval(() => {
            if (waveSurferRef.current && waveSurferRef.current.isPlaying()) {
                const time = waveSurferRef.current.getCurrentTime();
                setCurrentTime(time);
                // Force waveform to sync on mobile
                waveSurferRef.current.seekTo(time / waveSurferRef.current.getDuration());
            }
        }, 100); // Update every 100ms for smoother mobile experience
    };

    const stopProgressSync = () => {
        if (progressTimerRef.current) {
            clearInterval(progressTimerRef.current);
            progressTimerRef.current = null;
        }
    };

    const togglePlay = async () => {
        if (!waveSurferRef.current) return;

        try {
            // Inform global manager — it will stop others
            if (!waveSurferRef.current.isPlaying()) {
                setCurrentWaveSurfer(waveSurferRef.current);

                // For mobile: ensure audio context is resumed
                if (waveSurferRef.current.backend && waveSurferRef.current.backend.ac) {
                    await waveSurferRef.current.backend.ac.resume();
                }

                await waveSurferRef.current.play();
            } else {
                waveSurferRef.current.pause();
            }
        } catch (error) {
            console.error('Audio playback error:', error);
            // Fallback: try play/pause without async
            waveSurferRef.current.playPause();
        }
    };

    const formatTime = time => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="flex items-center gap-2 bg-gray-100 px-3 pb-2 rounded-lg shadow-sm w-[250px]">
            {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            ) : (
                <button
                    onClick={togglePlay}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded touch-manipulation"
                    style={{
                        // Improve touch responsiveness on mobile
                        minHeight: '44px',
                        minWidth: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {isPlaying ? <Square size={16} /> : <Play size={16} />}
                </button>
            )}

            <div className="flex-1">
                <div ref={waveformRef} className="w-full pt-5 overflow-hidden" />
                <div className="text-xs text-gray-600 text-right mt-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
}