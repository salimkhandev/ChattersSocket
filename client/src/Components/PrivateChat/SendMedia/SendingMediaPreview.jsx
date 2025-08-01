'use client';
import React from 'react';
import { useMedia } from '../../../context/MediaContext';
import { Loader2 } from 'lucide-react';

export default function MediaPreview() {
    const { localUrl, localFormat, uploading } = useMedia();

    if (!localUrl || !localFormat) return null;

    const format = localFormat.toLowerCase();

    const renderPreview = () => {
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format)) {
            return (
                <img
                    src={localUrl}
                    alt="sent image"
                    className="w-full h-auto object-cover"
                />
            );
        }

        if (['mp4', 'webm'].includes(format)) {
            return (
                <video
                    src={localUrl}
                    controls
                    className="w-full h-auto object-cover"
                />
            );
        }

        if (['mp3', 'wav', 'ogg'].includes(format)) {
            return (
                <audio
                    src={localUrl}
                    controls
                    className="bg-gray-100 rounded"
                />
            );
        }

        return (
            <a
                href={localUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200 transition"
                download
            >
                <span className="text-sm text-blue-600 underline break-all">
                    {`Download ${localFormat.toUpperCase()}`}
                </span>
            </a>
        );
    };

    return (
        <div className="px-4 py-2 mb-1 mr-[-16px] rounded-xl max-w-xs text-sm shadow-sm bg-green-200 text-gray-900">
            <div className="text-xs text-gray-500 mb-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-semibold text-gray-700">You</span>
                </div>

                <div className="flex flex-col items-start gap-1">
                    <div className="rounded overflow-hidden border border-gray-200 shadow-sm max-w-xs w-full">
                        {renderPreview()}
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2">Unseen</span>
                </div>
            </div>

            <div className="break-word items-start justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                    {uploading && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin opacity-60" />
                    )}
                </div>
            </div>
        </div>
    );
}
