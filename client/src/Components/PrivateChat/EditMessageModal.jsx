import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

const EditMessageModal = ({ isOpen, message, onClose, onSave }) => {
    const [editText, setEditText] = useState(message || '');

    useEffect(() => {
        if (isOpen) {
            setEditText(message || '');
        }
    }, [isOpen, message]);

    const handleSave = () => {
        if (editText.trim() && editText.trim() !== message) {
            onSave(editText.trim());
        }
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-1rem)] max-w-sm sm:max-w-md mx-2 sm:mx-4">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">Edit Message</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-3 sm:p-4 overflow-y-auto">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            rows="4"
                            placeholder="Edit your message..."
                            autoFocus
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors touch-manipulation"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!editText.trim() || editText.trim() === message}
                            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors touch-manipulation"
                        >
                            Save changes
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditMessageModal;