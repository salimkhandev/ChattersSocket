'use client';

import React, { useState, useRef, useEffect, forwardRef,useImperativeHandle } from 'react';
import { Mic, StopCircle, Send, Loader2, Trash2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import AudioWaveIcon from "./AudioWaveIcon";

const VoiceRecorder = forwardRef(({ socket, sender, receiver, onDone, setIsRecording }, ref) => {
    const [recording, setRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const waveformRef = useRef(null);
    const waveSurferRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [recordTime, setRecordTime] = useState(0);
    // const [recordTime, setRecordTime] = useState(0);
    const intervalRef = useRef(null);
    const [tempVoice,setTempVoice]=useState([])

    const startRecording = async () => {
       // reset timer

        intervalRef.current = setInterval(() => {
            setRecordTime(prev => prev + 1);
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
            setAudioUrl(localUrl); // temporary preview
            setUploading(true);

            // Upload to server (which uploads to Cloudinary)
            const formData = new FormData();
            formData.append('audio', blob);

            try {
                const res = await fetch('http://localhost:3000/upload-audio', {
                    method: 'POST',
                    body: formData,
                });

                const { audio_url } = await res.json();

                if (audio_url) {
                    setAudioUrl(audio_url); // ✅ only this should be sent
                } else {
                    console.error('No audio_url returned');
                }
            } catch (err) {
                console.error('Upload failed', err);
            } finally {
                setUploading(false);
            }
        };
        mediaRecorderRef.current.start();
        setRecording(true);
        setRecordTime(0); 
        // mediaRecorderRef.current.start();
        // setRecording(true);
    };

    const stopRecording = () => {
        
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

        }
        setRecording(false);
    };

    const sendMessage = () => {
        if (!audioUrl || uploading) return;

        socket.emit('chat messages', {
            sender,
            receiver,
            message: null,
            audio_url: audioUrl,
            is_voice: true,
        });

        // Cleanup
        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
            waveSurferRef.current = null;
        }

        setAudioUrl(null);
        onDone?.();
    };

    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return;

        if (waveSurferRef.current) {
            waveSurferRef.current.destroy();
        }

        waveSurferRef.current = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#a1a1aa',
            progressColor: '#3b82f6',
            cursorColor: '#000',
            height: 60,
            barWidth: 2,
            responsive: true,
        });

        waveSurferRef.current.load(audioUrl);
        // waveSurferRef.current.load(src);

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
    }, [audioUrl]);
    useImperativeHandle(ref, () => ({
        startRecording,
        stopRecording,
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
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg  bg-white w-full max-w-md mx-auto">
            {recording ? (
            //   here the time of recording should be shown
                <div className="flex items-center justify-between w-full px-2">
                    <AudioWaveIcon />
                    <div className="text-sm text-gray-700 font-medium ml-auto">
                         {formatTime(recordTime)}
                    </div>
                </div>

                
            ) : audioUrl &&  (
                    <div className="w-full border rounded-lg p-3 bg-gray-50">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">🎧 Voice Message Preview</label>

                        <div ref={waveformRef} className="w-full h-[60px] mb-2" />

                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center gap-12 mt-3">
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
                                className="px-3 py-1.5 rounded text-white bg-blue-500 hover:bg-blue-600 text-sm"
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>

                            <button
                                onClick={() => {
                                    setAudioUrl(null);
                                    setRecording(false);
                                    if (waveSurferRef.current) {
                                        waveSurferRef.current.destroy();
                                        waveSurferRef.current = null;
                                        setIsRecording(false)
                                    }
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-red-500 hover:bg-red-100 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                                Cancel
                            </button>

                            <button
                                onClick={sendMessage}
                                disabled={uploading}
                                className={`flex items-center gap-2 px-4 py-2 text-white rounded-md ${uploading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
                                    }`}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Send
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

            ) }
        </div>
    );
}
)
export default VoiceRecorder;
