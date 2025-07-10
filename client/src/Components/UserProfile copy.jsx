// 📦 FRONTEND COMPONENT (UserProfileUpload.js)
import React, { useRef, useState } from "react";

export default function UserProfileUpload({ user,fullName, socket }) {
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("username", user.username);
        console.log('My form data', formData);
        

        setLoading(true);
        try {
            const res = await fetch("https://8b81f6f7-2710-45c7-9f7a-d10faa8f99b3-00-1biywnnfgs4xq.riker.replit.dev/upload-profile-pic", {
                method: "POST",
                body: formData,
            });
            // const res = await fetch("http://localhost:3000/upload-profile-pic", {
            //     method: "POST",
            //     body: formData,
            // });

            const data = await res.json();
            if (data.url) {
                socket.emit("profile picture updated", {
                    username: user.username,
                    profilePic: data.url,
                });
            }
        } catch (err) {
            console.error("Upload failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user.profilePic) return;
        setLoading(true);
        try {
            const res = await fetch("http://:3000/delete-profile-pic", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: user.username }),
            });

            const data = await res.json();
            if (data.success) {
                socket.emit("profile picture updated", {
                    username: user.username,
                    profilePic: null,
                });
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 text-center">
            <h3>{fullName}</h3>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
            />
            <button
                onClick={() => fileInputRef.current.click()}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2"
            >
                {loading ? "Uploading..." : "Change Profile Picture"}
            </button>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
            >
                {loading ? "Deleting..." : "Delete Picture"}
            </button>
        </div>
    );
}
