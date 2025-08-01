'use client';
import React from 'react';
import { useMedia } from '../../../context/MediaContext';
import { XCircle, Send } from 'lucide-react';
import { useUpload } from '../../../context/UploadContext';

export default function MediaPreview() {
    const { callUploadFn } = useUpload();
    const { localUrl, setLocalUrl, localFormat, setLocalFormat, isModalOpen, setIsModalOpen } = useMedia();

    if (!localUrl || !localFormat) return null;

    const handleCancel = () => {
        setLocalUrl(null);
        setLocalFormat(null);
        setIsModalOpen(false)
    };

    const renderPreview = () => {
        const format = localFormat.toLowerCase();

        if (['mp3', 'wav', 'webm'].includes(format)) {
            return (
                <audio controls className="w-full rounded-md shadow">
                    <source src={localUrl} type={`audio/${format}`} />
                    Your browser does not support the audio element.
                </audio>
            );
        }

        if (['mp4', 'webm', 'ogg'].includes(format)) {
            return (
                <video controls className="w-full rounded-md shadow max-h-[300px]">
                    <source src={localUrl} type={`video/${format}`} />
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format)) {
            return (
                <img
                    src={localUrl}
                    alt="Preview"
                    className="w-full max-h-[300px] object-contain rounded-md shadow"
                />
            );
        }

        return (
            <div className="flex items-center justify-center w-full h-40 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-500">Preview not supported for this file type.</p>
            </div>
        );
    };

    return (
        <div className="p-4 rounded-xl border border-gray-300 bg-white shadow-md space-y-4 max-w-md mx-auto">
            <div className="text-center font-semibold text-gray-700">Media Preview</div>

            <div className="rounded-lg overflow-hidden">{renderPreview()}</div>

            <div className="flex justify-end gap-4">
                <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                >
                    <XCircle className="w-4 h-4" />
                    Cancel
                </button>

                <button
                    onClick={callUploadFn}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600"
                >
                    <Send className="w-4 h-4" />
                    Send
                </button>
            </div>
        </div>
    );
}
