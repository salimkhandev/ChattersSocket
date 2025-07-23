'use client';
import imageCompression from "browser-image-compression";
import { Camera, Check, Edit3, Smile, Send, Trash2, Users, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../../context/UserContext";

function GroupProfile({ groupID, groupName, setGroupName, socket, created_by }) {
    const { username, } = useUser();

    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [profilePic, setProfilePic] = useState(null);
    const [currentGroupName, setCurrentGroupName] = useState(groupName);
    const [newGroupName, setNewGroupName] = useState(groupName);
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameError, setNameError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiList = ["😀", "😂", "😍", "😎", "🥳", "🔥", "👍", "🎉", "😢", "🤔", "👏", "❤️"];

    const fetchProfilePic = async () => {
        if (!groupID) {
            console.error("Group ID is undefined");
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/get-group-profile-pic/${groupID}`);
            if (!res.ok) {
                throw new Error('Failed to fetch profile picture');
            }
            const data = await res.json();
            
            // The profilePicUrl is the direct URL string from Supabase
            if (data?.profilePicUrl?.profile_pic) {
                setProfilePic(data.profilePicUrl.profile_pic);
            }
        } catch (err) {
            console.error("Error fetching group profile picture:", err);
            if (profilePic!=null) {
                
                setUploadError("Failed to load profile picture");
            }
            }
    };

    useEffect(() => {
        if (groupID) {
            fetchProfilePic();
        }
    }, [groupID]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !groupID) {
            setUploadError("Please select a file and ensure group ID is available");
            return;
        }

        // Check if file is larger than 1MB
        if (file.size > 1024 * 1024) {
            throw new Error('File size must be less than 1MB');
        }

        try {
            setIsUploading(true);
            setUploadError('');

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select an image file');
            }

            let fileToUpload = file;
            // If file is larger than 200KB, compress it
            if (file.size > 204800) { // 200KB in bytes
                const options = {
                    maxSizeMB: 0.2, // 200KB
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                    initialQuality: 0.8
                };
                fileToUpload = await imageCompression(file, options);
            }

            const formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("groupID", groupID);

            const response = await fetch("http://localhost:3000/upload-group-profile-pic", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            console.log("Upload response:", data);
            
            // The profilePicUrl should be the complete Supabase URL
            if (data?.profilePicUrl) {
                setProfilePic(data.profilePicUrl);
                socket.emit("group profile updated", {
                    groupID,
                    profile_pic: data.profilePicUrl
                });
            } else {
                throw new Error('No profile picture URL in response');
            }

            setIsDialogOpen(false);
            setUploadError('');
        } catch (err) {
            console.error("Error uploading image:", err);
            setUploadError(err.message || 'Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!groupID) {
            setUploadError("Group ID is required");
            return;
        }

        try {
            setIsDeleting(true);
            const response = await fetch("http://localhost:3000/delete-group-profile-pic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupID }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete profile picture');
            }

            await response.json(); // Ensure we wait for the response

            setProfilePic(null);
            socket.emit("group profile updated", {
                groupID,
                profile_pic: null
            });
            
            setIsDialogOpen(false);
            setUploadError('');
        } catch (err) {
            console.error("Error deleting image:", err);
            setUploadError(err.message || 'Failed to delete image');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNameUpdate = async () => {
        if (!groupID) {
            setNameError("Group ID is required");
            return;
        }

        if (!newGroupName.trim() || newGroupName === currentGroupName) {
            setIsEditingName(false);
            setNewGroupName(currentGroupName);
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/update-group-name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    groupID,
                    groupName: newGroupName.trim()
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update group name');
            }

            const data = await response.json();

            // Update only if the server confirms success
            if (data.success) {
                setCurrentGroupName(newGroupName);
                setGroupName(newGroupName);
                socket.emit("group name updated", {
                    groupID,
                    name: newGroupName
                });
                setIsEditingName(false);
                setNameError('');
            } else {
                throw new Error(data.error || 'Failed to update group name');
            }
        } catch (err) {
            console.error("Error updating group name:", err);
            setNameError(err.message || 'Failed to update name');
            // Reset to previous name on error
            setNewGroupName(currentGroupName);
        }
    };

    return (
        <div className="relative group">
            <div 
                onClick={(e) => {
                    created_by === username ? setIsDialogOpen(true) : null
                    e.stopPropagation()
                }}
                className={`relative ${created_by === username ? 'cursor-pointer' : ''} group`}
            >
                {profilePic && profilePic.startsWith('http') ? (
                    <>
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <img
                                src={profilePic}
                                alt="Group profile"
                                className="w-full h-full object-cover"
                                onClick={(e) => e.stopPropagation()} 

                                onError={(e) => {
                                    console.error('Image failed to load:', profilePic);
                                    e.target.src = '';
                                    setProfilePic(null);
                                }}
                            />
                        </div>
                        {created_by === username && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5 text-gray-700" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <Users className="w-6 h-6 text-gray-400" />
                    </div>
                )}
            </div>

            {isDialogOpen && created_by === username && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-96 relative">
                        <button
                            onClick={(e) => {
                                setIsDialogOpen(false)
                                e.stopPropagation()
                            }}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-semibold mb-4">Group Profile</h3>

                        <div className="space-y-4">
                            {/* Group Name Edit */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-600">Group Name</label>
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 relative">
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            className="flex-1 px-3 py-1.5 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker((prev) => !prev)}
                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Insert Emoji"
                                        >
                                            <Smile className="w-5 h-5 text-gray-500" />
                                        </button>
                                        {showEmojiPicker && (
                                            <>
                                                {/* Click outside overlay */}
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowEmojiPicker(false)}
                                                />
                                                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-xl shadow-lg p-3 grid grid-cols-6 gap-2 z-50">
                                                    {emojiList.map((emoji, idx) => (
                                                        <button
                                                            key={idx}
                                                            className="text-xl hover:scale-125 transition-transform"
                                                            onClick={() => {
                                                                setNewGroupName((prev) => prev + emoji);
                                                                setShowEmojiPicker(false);
                                                            }}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    handleNameUpdate();
                                                    setIsEditingName(false);
                                                    e.stopPropagation()
                                                }}
                                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setNewGroupName(currentGroupName);
                                                    setIsEditingName(false);
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-800">{currentGroupName}</span>
                                        <button
                                            onClick={(e) => {
                                                setIsEditingName(true)
                                                e.stopPropagation()
                                            }}
                                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                {nameError && <p className="text-sm text-red-500">{nameError}</p>}
                            </div>

                            {/* Profile Picture */}
                            <div className="space-y-2">
                                <label className="text-sm text-gray-600">Profile Picture</label>
                                <div className="flex items-center justify-center">
                                    {profilePic && profilePic.startsWith('http') ? (
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-full overflow-hidden">
                                                <img
                                                    src={profilePic}
                                                    alt="Group profile"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Image failed to load:', profilePic);
                                                        e.target.src = '';
                                                        setProfilePic(null);
                                                        e.stopPropagation()
                                                    }}
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        handleDeleteImage()
                                                        e.stopPropagation()
                                                    }}
                                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                                    disabled={isDeleting || isUploading}
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Users className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                    <div onClick={(e) => e.stopPropagation()} className="flex justify-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={
                                            (e) => {
                                                handleImageUpload(e)
                                                e.stopPropagation()
                                            }
                                        }
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            fileInputRef.current?.click()
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        disabled={isUploading || isDeleting}
                                    >
                                        <Camera className="w-4 h-4" />
                                        {isUploading ? "Uploading..." : "Upload New Picture"}
                                    </button>
                                    {profilePic && (
                                        <button
                                            onClick={(e) => {
                                                handleDeleteImage()
                                                e.stopPropagation()
                                            }}
                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2"
                                            disabled={isDeleting || isUploading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isDeleting ? "Deleting..." : "Delete"}
                                        </button>
                                    )}

                                </div>
                                {uploadError && <p className="text-sm text-red-500 text-center">{uploadError}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 


export default React.memo(GroupProfile);