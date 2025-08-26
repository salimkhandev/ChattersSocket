'use client';
import React, { useState } from 'react';
import { useMedia } from '../../../context/MediaContext';
import { XCircle, Send } from 'lucide-react';
import { useUpload } from '../../../context/UploadContext';

export default function MediaPreview() {
    const { callUploadFn } = useUpload();
    const { localUrl, setLocalUrl, localFormat, setLocalFormat, isModalOpen, setIsModalOpen } = useMedia();
    const [loading, setLoading] = useState(true);
    if (!localUrl || !localFormat) return (
        <div className="flex items-center justify-center h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col items-center space-y-3">
                {/* Animated spinner */}
                <div className="relative">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 border-3 border-transparent border-b-blue-300 rounded-full animate-spin animation-delay-150"></div>
                </div>

                {/* Loading text with pulse effect */}
                <div className="flex items-center space-x-1">
                    <span className="text-sm sm:text-base font-medium text-gray-600 animate-pulse">Loading</span>
                    <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce animation-delay-200"></div>
                    </div>
                </div>

        
            </div>
        </div>
    );
    

    const handleCancel = () => {
        setLocalUrl(null);
        setLocalFormat(null);
        setIsModalOpen(false)
    };

    const renderPreview = () => {
        const format = localFormat.toLowerCase();

        if (['mp3', 'wav', 'webm'].includes(format)) {
            return (
                <audio controls className="w-full rounded-md shadow-sm">
                    <source src={localUrl} type={`audio/${format}`} />
                    Your browser does not support the audio element.
                </audio>
            );
        }

        if (['mp4', 'webm', 'ogg'].includes(format)) {
            return (
                <video controls className="w-full rounded-md shadow-sm max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px]">
                    <source src={localUrl} type={`video/${format}`} />
                    Your browser does not support the video tag.
                </video>
            );
        }

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format)) {
            return (
                <>
                    {loading && (
                        <div className="flex items-center justify-center h-32 sm:h-40 text-center text-gray-500">
                            <div className="animate-pulse">Loading...</div>
                        </div>
                    )}
                    <img
                        src={localUrl}
                        alt="Preview"
                        onLoad={() => setLoading(false)}
                        className="w-full max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px] object-contain rounded-md shadow-sm"
                    />
                </>
            );
        }

        if (['pdf'].includes(format)) {
            return (
                <iframe
                    src={localUrl}
                    className="w-full h-64 sm:h-72 md:h-80 lg:h-96 border rounded-md shadow-sm"
                    title="PDF Preview"
                />
            );
        }

        if (['txt', 'csv', 'json', 'xml', 'html', 'log', 'md', 'css', 'js', 'ini'].includes(format)) {
            return (
                <iframe
                    src={localUrl}
                    className="w-full h-48 sm:h-56 md:h-60 lg:h-64 border rounded-md shadow-sm bg-white"
                    title="Text File Preview"
                />
            );
        }

    



        return (
            <div className="flex items-center justify-center w-full h-32 sm:h-40 bg-gray-100 rounded-md">
                <p className="text-xs sm:text-sm text-gray-500 px-4 text-center">
                    Preview not supported for this file type.
                </p>
            </div>
        );
    };

    return (

        <div className="p-3 sm:p-4 md:p-6 rounded-xl border border-gray-300 bg-white shadow-md space-y-3 sm:space-y-4 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
            <div className="text-center font-semibold text-gray-700 text-sm sm:text-base">
                Media Preview
            </div>

            <div className="rounded-lg overflow-hidden">
                {renderPreview()}
            </div>

            <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-2 sm:gap-3 md:gap-4">
                <button
                    onClick={handleCancel}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 sm:py-1.5 text-xs sm:text-sm rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors w-full sm:w-auto order-2 sm:order-1"
                >
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Cancel
                </button>

                <button
                    onClick={callUploadFn}
                    className="flex items-center justify-center gap-1 sm:gap-2 px-4 py-2 sm:py-1.5 text-xs sm:text-sm rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors w-full sm:w-auto order-1 sm:order-2"
                >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    Send
                </button>
            </div>
        </div>
    );
}