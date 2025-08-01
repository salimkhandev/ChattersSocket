    'use client';
    import React from 'react';
    import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
    import { X } from 'lucide-react';

    export default function MediaModal({ url, format, onClose }) {
        if (!url || !format) return null;

        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(format.toLowerCase());

        return (
            <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
                <div className="relative w-full h-full p-4">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-4 bg-white rounded-full border-2 border-red-500 p-1 hover:bg-red-100 z-50"
                        style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X className="text-red-500 w-4 h-4" />
                    </button>

                    {/* Image with zoom & pan */}
                    {isImage && (
                        <div className="overflow-auto w-full h-full flex items-center justify-center">
                            <TransformWrapper
                                doubleClick={{ mode: 'zoomIn' }}
                                wheel={{ step: 0.2 }}
                                pinch={{ step: 5 }}
                                panning={{ velocityDisabled: true }}
                                limitToBounds={false}
                            >
                                <TransformComponent>
                                    <img
                                        src={url}
                                        alt="Zoomable"
                                        className="max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain select-none"
                                        draggable={false}
                                    />
                                </TransformComponent>
                            </TransformWrapper>
                        </div>
                    )}
                </div>
            </div>
        );
    }
