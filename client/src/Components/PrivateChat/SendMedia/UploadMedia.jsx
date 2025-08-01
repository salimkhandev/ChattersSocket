'use client';

import { useMedia } from '../../../context/MediaContext';
import React, { useState, useEffect } from 'react';
import { useUpload } from "../../../context/UploadContext";

import { FilePlus, Loader2, Upload } from 'lucide-react';
import axios from 'axios';
// import { useMedia } from '../../../context/MediaContext';

const UploadMedia = ({ sender, receiver, socket }) => {
    const { registerUploadFn } = useUpload();
    const [file, setFile] = useState(null);
    // const [localUrl, setLocalUrl] = useState(null);
    // const [localFormat, setLocalFormat] = useState(null);
    const { setLocalUrl, setLocalFormat, setUploading, isModalOpen, setIsModalOpen} = useMedia();

    const handleFileChange = (e) => {
        setIsModalOpen(true)
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        const localPreviewUrl = URL.createObjectURL(selectedFile);
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

        setFile(selectedFile);
        setLocalUrl(localPreviewUrl);
        setLocalFormat(fileExtension);
    };

    const handleUpload = async () => {                  
        if (!file) return;
        
        setIsModalOpen(false)
       // 👈 triggers modal in MessageInput
       const formData = new FormData();
       formData.append('file', file);
       setUploading(true);

        try {
            const response = await axios.post('http://localhost:3000/upload-media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const { media_url, format } = response.data;

            socket.emit('chat messages', {
                sender,
                receiver,
                message: null,
                audio_url: null,
                is_voice: null,
                media_url,
                format,
            });

            // Reset
            setFile(null);
            setLocalUrl(null);
            setLocalFormat(null);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };
    useEffect(() => {
        registerUploadFn(handleUpload); // Register the upload function
    }, [file]); 
    return (
        <div className="relative inline-block space-y-2">
            {/* File Picker */}
            <label className="cursor-pointer inline-block">
                <FilePlus size={24} />
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </label>

            {/* Upload Button */}
      

            {/* Loader */}
          
        </div>
    );
};

export default UploadMedia;
