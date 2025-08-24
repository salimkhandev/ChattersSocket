// ForgetPassword.jsx
import React, { useState } from "react";

const backendURL = import.meta.env.VITE_BACKEND_URL; // your backend URL

export default function ForgetPassword({ goLogin }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch(`${backendURL}/forget-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("✅ Password reset link sent! Check your email.");
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
                <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">Forget Password</h1>

                {message && (
                    <p className={`mb-4 text-center ${message.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-4 flex justify-between">
            

                    <button
                        onClick={goLogin}
                        className="text-sm text-blue-500 hover:underline"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
