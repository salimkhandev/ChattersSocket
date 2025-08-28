'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mic, StopCircle, Send, Loader2, Trash2, Play, Pause } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import AudioWaveIcon from "./AudioWaveIcon";
import { useVoice } from '../../../context/VoiceContext';
const backendURL = import.meta.env.VITE_BACKEND_URL;

const VoiceRecorder = forwardRef(({ socket, sender, receiver, onDone, setIsRecording}, ref) => {
    const [uploading, setUploading] = useState(false);
    // const [recording, setRecording] = useState(false);
    // const mediaRecorderRef = useRef(null);
    // const intervalRef = useRef(null);
    const audioChunksRef = useRef([]);
    const waveformRef = useRef(null);
    const waveSurferRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    // const [recordTime, setRecordTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const { tempVoiceUrl, setTempVoiceUrl, setTempUrlAudio, recording, setRecording, mediaRecorderRef, intervalRef } = useVoice();

    const playSendSound = () => {
        const audio = new Audio('/notification/Sending-Message-Sound.mp3');
        audio.volume = 0.05;
        audio.play().catch((err) => {
            console.warn('Sound play error:', err);
        });
    };

    const uploadVoice = async (blob) => {
        if (!blob) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('audio', blob);

        try {
            const res = await fetch(`${backendURL}/upload-audio`, {
                method: 'POST',
                body: formData,
            });

            const { audio_url } = await res.json();
            if (audio_url) {
                return audio_url;
            } else {
                console.error('No audio_url returned');
            }
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
        }
    };

    const startRecording = async () => {
        intervalRef.current = setInterval(() => {
            // setRecordTime(prev => prev + 1);
        }, 1000);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const localUrl = URL.createObjectURL(blob);
            setTempVoiceUrl(localUrl);
            setAudioBlob(blob);
        };

        mediaRecorderRef.current.start();
        setRecording(true);
        // setRecordTime(0);
    };

    // const stopRecording = () => {
        // if (mediaRecorderRef.current) {
        //     mediaRecorderRef.current.stop();
        //     mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

        //     if (intervalRef.current) {
        //         clearInterval(intervalRef.current);
        //         intervalRef.current = null;
        //     }
        // }
        // setRecording(false);
    // };

    const sendMessage = async () => {
        if (!audioBlob) return;
        setIsRecording(false);
        setTempUrlAudio(true);
        const uploadedUrl = await uploadVoice(audioBlob);

        setTempVoiceUrl(null);
        setTempUrlAudio(null);

        socket.emit('chat messages', {
            sender,
            receiver,
            message: null,
            audio_url: uploadedUrl,
            is_voice: true,
        });
        playSendSound();

        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
            waveSurferRef.current = null;
        }

        onDone?.();
    };

    const clearRecording = () => {
        setRecording(false);
        setTempUrlAudio(null);
        setTempVoiceUrl(null);
        setAudioBlob(null);
        // setRecordTime(0);
        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
            waveSurferRef.current = null;
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if (!tempVoiceUrl || !waveformRef.current) return;

        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
        }

        waveSurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#e2e8f0',
            progressColor: '#3b82f6',
            cursorColor: '#1e40af',
            height: 50,
            barWidth: 2,
            barGap: 1,
            responsive: true,
            normalize: true,
        });

        waveSurferRef.current.load(tempVoiceUrl);

        waveSurferRef.current.on('ready', () => {
            setDuration(waveSurferRef.current.getDuration());

            waveSurferRef.current.on('audioprocess', () => {
                if (waveSurferRef.current.isPlaying()) {
                    setCurrentTime(waveSurferRef.current.getCurrentTime());
                }
            });

            waveSurferRef.current.on('interaction', () => {
                setTimeout(() => {
                    setCurrentTime(waveSurferRef.current.getCurrentTime());
                }, 50);
            });

            waveSurferRef.current.on('finish', () => {
                setIsPlaying(false);
                setCurrentTime(waveSurferRef.current.getDuration());
            });
        });

        return () => {
            if (waveSurferRef.current) {
                waveSurferRef.current.destroy();
                waveSurferRef.current = null;
            }
        };
    }, [tempVoiceUrl]);

    useImperativeHandle(ref, () => ({
        startRecording,
        // stopRecording, // Comment this out since we're using useVoice hook instead      
    }));

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60)
            .toString()
            .padStart(2, '0');
        const seconds = Math.floor(time % 60)
            .toString()
            .padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            {recording ? (
                //   here the time of recording should be shown
                <div className="flex items-center justify-between w-full px-2">
                    <AudioWaveIcon />
                    {/* <div className="text-sm text-gray-700 font-medium ml-auto">
                         {formatTime(recordTime)}
                    </div> */}
                </div>
            ) : tempVoiceUrl && (
                // Preview State
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-lg">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Voice Message Preview</span>
                    </div>

                    {/* Waveform Container */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                        <div ref={waveformRef} className="w-full h-[50px] mb-3" />
                        
                        {/* Time Display */}
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 font-mono">
                            <span className="bg-white px-2 py-1 rounded">{formatTime(currentTime)}</span>
                            <span className="bg-white px-2 py-1 rounded">{formatTime(duration)}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Play/Pause Button */}
                        <button
                            onClick={() => {
                                if (waveSurferRef.current) {
                                    if (isPlaying) {
                                        waveSurferRef.current.pause();
                                    } else {
                                        waveSurferRef.current.play();
                                    }
                                    setIsPlaying(!isPlaying);
                                }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-all duration-200 hover:shadow-md flex-1 sm:flex-none"
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            <span className="font-medium">{isPlaying ? 'Pause' : 'Play'}</span>
                        </button>

                        {/* Cancel Button */}
                        <button
                            onClick={clearRecording}
                            className="flex items-center justify-center gap-2 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 hover:shadow-md flex-1 sm:flex-none"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="font-medium">Cancel</span>
                        </button>

                        {/* Send Button */}
                        <button
                            onClick={sendMessage}
                            disabled={uploading}
                            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 flex-1 sm:flex-none ${
                                uploading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-md'
                            }`}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Sending...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Send</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default VoiceRecorder;