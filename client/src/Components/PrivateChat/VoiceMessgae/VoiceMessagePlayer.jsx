'use client';
import { Play, Square } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { setCurrentWaveSurfer, onWaveSurferChange } from '../../../context/globalWaveSurferManager';

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
        });

        waveSurferRef.current.load(audioUrl);

        waveSurferRef.current.on('ready', () => {
            setIsLoading(false);
            setDuration(waveSurferRef.current.getDuration());

            waveSurferRef.current.on('audioprocess', () => {
                if (waveSurferRef.current.isPlaying()) {
                    setCurrentTime(waveSurferRef.current.getCurrentTime());
                }
            });

            waveSurferRef.current.on('finish', () => {
                setIsPlaying(false);
                setCurrentTime(waveSurferRef.current.getDuration());
            });
        });

        // 🔄 listen for global changes
        const unsubscribe = onWaveSurferChange((ws, playing) => {
            if (ws !== waveSurferRef.current) {
                // another audio started → reset this one
                setIsPlaying(false);
            }
        });

        return () => {
            unsubscribe();
            waveSurferRef.current?.destroy();
        };
    }, [audioUrl]);

    const togglePlay = () => {
        if (!waveSurferRef.current) return;

        if (!waveSurferRef.current.isPlaying()) {
            setCurrentWaveSurfer(waveSurferRef.current);
        }

        waveSurferRef.current.playPause();
        setIsPlaying(prev => !prev);
    };

    const formatTime = (time) => {
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
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
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
