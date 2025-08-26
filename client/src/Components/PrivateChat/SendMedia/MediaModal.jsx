'use client';
import React, { useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

export default function MediaModal({ url, format, onClose }) {
    
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format.toLowerCase());
    const isVideo = ['mp4', 'webm', 'mov'].includes(format.toLowerCase());

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `media.${format}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    if (!url || !format) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="relative w-full h-full max-w-7xl max-h-screen p-2 sm:p-4 md:p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full uppercase">
                            {format}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            onClick={handleDownload}
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 sm:p-2.5 rounded-full transition-colors duration-200"
                            title="Download"
                        >
                            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-white/20 backdrop-blur-sm hover:bg-red-500/80 text-white p-2 sm:p-2.5 rounded-full transition-colors duration-200"
                            title="Close (Esc)"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full h-full pt-12 sm:pt-16 flex items-center justify-center overflow-hidden">
                    {isImage && (
                        <div className="w-full h-full flex items-center justify-center">
                            <TransformWrapper
                                initialScale={1}
                                minScale={0.1}
                                maxScale={5}
                                doubleClick={{ mode: 'zoomIn' }}
                                wheel={{ step: 0.1 }}
                                pinch={{ step: 5 }}
                                panning={{ velocityDisabled: true, disabled: false }}
                                limitToBounds={false}
                                centerOnInit={true}
                                centerZoomedOut={true}
                                alignmentAnimation={{
                                    sizeX: 0,
                                    sizeY: 0,
                                    velocityAlignmentTime: 0.3,
                                }}
                                initialPositionX={0}
                                initialPositionY={0}
                            >
                                {({ zoomIn, zoomOut, resetTransform }) => (
                                    <>
                                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full p-2">
                                            <button
                                                onClick={() => zoomOut()}
                                                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                                            >
                                                <ZoomOut className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => resetTransform()}
                                                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => zoomIn()}
                                                className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                                            >
                                                <ZoomIn className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <TransformComponent
                                            wrapperClass="!w-full !h-full"
                                            contentClass="!w-full !h-full !flex !items-center !justify-center"
                                        >
                                            <div className="flex items-center justify-center w-full h-full">
                                                <img
                                                    src={url}
                                                    alt="Media preview"
                                                    className="max-w-full max-h-full object-contain select-none rounded-lg shadow-2xl"
                                                    draggable={false}
                                                    loading="lazy"
                                                />
                                            </div>
                                        </TransformComponent>
                                    </>
                                )}
                            </TransformWrapper>
                        </div>
                    )}

                    {isVideo && (
                        <div className="flex items-center justify-center w-full h-full">
                            <video
                                src={url}
                                controls
                                autoPlay={false}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                controlsList="nodownload"
                            />
                        </div>
                    )}

                    {!isImage && !isVideo && (
                        <div className="flex flex-col items-center justify-center text-white space-y-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-8 text-center">
                                <p className="text-lg mb-4">Preview not available for {format.toUpperCase()} files</p>
                                <button
                                    onClick={handleDownload}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto"
                                >
                                    <Download className="w-5 h-5" />
                                    Download File
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mobile instructions */}
                    <div className="absolute bottom-4 left-4 right-4 sm:hidden">
                        <div className="bg-black/60 backdrop-blur-sm text-white text-xs text-center py-2 px-4 rounded-lg">
                            {isImage
                                ? 'Pinch to zoom • Drag to pan • Double tap to zoom'
                                : 'Tap outside to close'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
