'use client';
import { Play, Square } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { setCurrentWaveSurfer } from '../../../context/globalWaveSurferManager';

export default function VoiceMessagePlayer({ audioUrl }) {
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [audioBuffer, setAudioBuffer] = useState(null);

    // Create a simple waveform visualization
    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        const audio = audioRef.current;
        if (!canvas || !audio || !audioBuffer) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        ctx.clearRect(0, 0, width, height);

        // Draw static waveform based on audio buffer
        const data = audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.fillStyle = '#d1d5db';
        ctx.beginPath();

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;

            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            const barHeight = Math.max(1, (max - min) * amp);
            ctx.fillRect(i, amp - barHeight / 2, 1, barHeight);
        }

        // Draw progress
        const progress = audio.duration ? (audio.currentTime / audio.duration) * width : 0;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();

        for (let i = 0; i < progress; i++) {
            let min = 1.0;
            let max = -1.0;

            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            const barHeight = Math.max(1, (max - min) * amp);
            ctx.fillRect(i, amp - barHeight / 2, 1, barHeight);
        }
    }, [audioBuffer]);

    // Load and decode audio for waveform
    useEffect(() => {
        if (!audioUrl) return;

        const loadAudio = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(audioUrl);
                const arrayBuffer = await response.arrayBuffer();

                // Create audio context for decoding
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                }

                const decoded = await audioContextRef.current.decodeAudioData(arrayBuffer);
                setAudioBuffer(decoded);
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading audio:', error);
                setIsLoading(false);
            }
        };

        loadAudio();
    }, [audioUrl]);

    // Setup audio element
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !audioUrl) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(audio.duration);
        };

        const handleCanPlay = () => {
            setIsLoading(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [audioUrl]);

    // Draw waveform when audio buffer is ready or time changes
    useEffect(() => {
        if (audioBuffer) {
            drawWaveform();
        }
    }, [audioBuffer, currentTime, drawWaveform]);

    // Animation loop for smoother progress updates
    useEffect(() => {
        if (isPlaying) {
            const animate = () => {
                drawWaveform();
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, drawWaveform]);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        try {
            if (audio.paused) {
                // Inform global manager
                setCurrentWaveSurfer({
                    isPlaying: () => !audio.paused,
                    pause: () => audio.pause()
                });

                await audio.play();
                setIsPlaying(true);
            } else {
                audio.pause();
                setIsPlaying(false);
            }
        } catch (error) {
            console.error('Error playing audio:', error);
        }
    };

    const handleCanvasClick = (e) => {
        const audio = audioRef.current;
        const canvas = canvasRef.current;
        if (!audio || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const progress = x / canvas.width;
        const newTime = progress * audio.duration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = time => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="flex items-center gap-2 bg-gray-100 px-3 pb-2 rounded-lg shadow-sm w-[250px]">
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {isLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            ) : (
                <button onClick={togglePlay} className="text-blue-600 hover:text-blue-800 p-1 rounded">
                    {isPlaying ? <Square size={16} /> : <Play size={16} />}
                </button>
            )}

            <div className="flex-1">
                <canvas
                    ref={canvasRef}
                    width={180}
                    height={20}
                    className="w-full h-5 cursor-pointer mt-3"
                    onClick={handleCanvasClick}
                />
                <div className="text-xs text-gray-600 text-right mt-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
}