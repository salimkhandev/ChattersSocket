'use client';
import React, { useRef, useState, useEffect } from "react";
import { User, Camera, Trash2, Edit3, Check, X, Settings } from "lucide-react";
import imageCompression from "browser-image-compression";

export default function UserProfileUpload({ username, fullName, socket }) {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [profilePic, setProfilePic] = useState(null);
    const [currentFullName, setCurrentFullName] = useState(fullName); // actual display name
    const [newFullName, setNewFullName] = useState(fullName); // temp input name

    const [isEditingName, setIsEditingName] = useState(false);
    const [nameError, setNameError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchProfilePic = async () => {
        try {
            const res = await fetch(`http://localhost:3000/get-profile-pic/${username}`);
            const data = await res.json();
            setProfilePic(data?.profilePicUrl || null);
        } catch (err) {
            console.error("Error fetching profile picture:", err);
        }
    };

    useEffect(() => {
        fetchProfilePic();
    }, [username]);

    const handleNameUpdate = async () => {
        if (!newFullName.trim()) {
            setNameError('Name cannot be empty');
            return;
        }

        if (newFullName.trim() === currentFullName) {

            setIsEditingName(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/update-fullname", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, fullName: newFullName }),
            });

            const data = await res.json();
            if (data.success && data.fullName) {
                setCurrentFullName(data.fullName);  // update UI display name
                setNewFullName(data.fullName);      // sync input with updated value
                setIsEditingName(false);
                setNameError('');
            }
 else {
                setNameError('Failed to update name');
            }
        } catch (err) {
            console.error("Failed to update name:", err);
            setNameError('Failed to update name');
        }
    };


    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setUploadError("Please select an image file");
            return;
        }

        // ✅ Compression settings
        const options = {
            maxSizeMB: 0.15,               // Target file size (300KB)
            maxWidthOrHeight: 400,        // Resize dimensions (good for profile pic)
            useWebWorker: true,
            initialQuality: 0.8,          // High initial quality
        };

        setLoading(true);
        setUploadError("");

        try {
            // 🗜️ Compress the file before upload
            const compressedFile = await imageCompression(file, options);

            const formData = new FormData();
            formData.append("file", compressedFile); // ⬅️ Use compressed image
            formData.append("username", username);

            const res = await fetch("http://localhost:3000/upload-profile-pic", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.profilePicUrl) {
                setProfilePic(data.profilePicUrl);
                socket.emit("profile picture updated", {
                    username,
                    profilePic: data.profilePicUrl,
                });
            } else {
                setUploadError("Upload failed. Please try again.");
            }
        } catch (err) {
            console.error("Upload failed:", err);
            setUploadError("Upload failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async () => {
        setLoading(true);
        setUploadError('');

        try {
            const res = await fetch("http://localhost:3000/delete-profile-pic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            const data = await res.json();
            if (data.success) {
                setProfilePic(null);
                socket.emit("profile picture updated", {
                    username,
                    profilePic: null,
                });
            } else {
                setUploadError('Delete failed. Please try again.');
            }
        } catch (err) {
            console.error("Delete failed:", err);
            setUploadError('Delete failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const cancelNameEdit = () => {
        setNewFullName(currentFullName);

        setIsEditingName(false);
        setNameError('');
    };

    const closeDialog = () => {
        setIsDialogOpen(false);
        setIsEditingName(false);
        setNameError('');
        setUploadError('');
        setNewFullName(currentFullName);

    };

    // Profile Display Component
 

    const ProfileDisplay = () => (
        <div
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group max-w-sm"
        >
            {/* Profile Picture */}
            <div className="relative">
                {profilePic ? (
                    <img
                        src={profilePic}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-200 transition-colors"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-100 group-hover:border-blue-200 transition-colors">
                        <User className="w-6 h-6 text-gray-400" />
                    </div>
                )}

                {/* Settings icon overlay */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings className="w-3 h-3 text-white" />
                </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                    {currentFullName || 'No name set'}

                </h3>
                <p className="text-sm text-gray-500 truncate">@{username}</p>
            </div>

            {/* Arrow indicator */}
            <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );

    // Dialog Component
    const ProfileDialog = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 relative">
                    <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
                    <p className="text-blue-100 text-sm">@{username}</p>

                    {/* Close button */}
                    <button
                        onClick={closeDialog}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative group">
                            {profilePic ? (
                                <img
                                    src={profilePic}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg">
                                    <User className="w-12 h-12 text-gray-400" />
                                </div>
                            )}

                            {/* Upload overlay */}
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={loading}
                                className="absolute inset-0 w-32 h-32 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
                            >
                                <Camera className="w-8 h-8 text-white" />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                {loading ? "Uploading..." : "Change Photo"}
                            </button>

                            {profilePic && (
                                <button
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {loading ? "Deleting..." : "Delete"}
                                </button>
                            )}
                        </div>

                        {/* Upload Error */}
                        {uploadError && (
                            <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {uploadError}
                            </div>
                        )}
                    </div>

                    {/* Name Section */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Full Name
                        </label>

                        {isEditingName ? (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={newFullName}
                                    onChange={(e) => {
                                        setNewFullName(e.target.value);
                                        setNameError('');
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="Enter your full name"
                                    autoFocus
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleNameUpdate}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Check className="w-4 h-4" />
                                        Save
                                    </button>
                                    <button
                                        onClick={cancelNameEdit}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
                                <span className="text-gray-900 font-medium">
                                    {fullName || 'No name set'}
                                </span>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Name Error */}
                        {nameError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                                {nameError}
                            </div>
                        )}
                    </div>

                    {/* File Input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageUpload}
                    />

                    {/* Upload Info */}
                    <div className="bg-gray-50 px-4 py-3 rounded-lg">
                        <p className="text-xs text-gray-600">
                            Supported formats: JPG, PNG, GIF • Max size: 5MB
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <ProfileDisplay />
            {isDialogOpen && <ProfileDialog />}
        </>
    );
}