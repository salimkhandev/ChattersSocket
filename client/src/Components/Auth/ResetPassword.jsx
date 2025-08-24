// ResetPassword.jsx
import React, { useState } from "react";

const backendURL = import.meta.env.VITE_BACKEND_URL;

export default function ResetPassword({ token, goHome }) {
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`${backendURL}/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("✅ Password reset successful! You can now login.");
            } else {
                setMessage(`❌ ${data.error || "Something went wrong"}`);
            }
        } catch (err) {
            setMessage(`❌ ${err.message}`);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
            <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
                    Reset Password
                </h1>

                {message && (
                    <p
                        className={`mb-4 text-center ${message.startsWith("✅") ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        required
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>

                <button
                    onClick={goHome}
                    className="mt-4 text-sm text-blue-500 hover:underline"
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}
