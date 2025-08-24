import React, { useEffect, useState } from 'react';
import { io } from "socket.io-client";
import { UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateToken } from '../FCM/firebase'; // adjust path
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
// import SignupForm from './SignupForm';
// import ForgetPassword from './ForgetPassword';

const backendURL = import.meta.env.VITE_BACKEND_URL;

const socket = io(`${backendURL}`, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
});

export default function LoginForm({ setIsLoggedIn, forgetPassword, signup }) {
    const { username, setUsername } = useAuth();
    const [fcm_token, setFcm_token] = useState(localStorage.getItem("token") || '');
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showSignup, setShowSignup] = useState(false); // ✅ state to toggle SignupForm

    // Generate FCM token on mount
    useEffect(() => {
        async function getToken() {
            if (!fcm_token) {
                const token = await generateToken();
                if (token) {
                    localStorage.setItem("token", token);
                    setFcm_token(token);
                }
            }
        }
        getToken();
    }, []);

    const handleLogin = async (values) => {
        const { username: inputUsername, password } = values;
        const trimmed = inputUsername.trim().toLowerCase();
        if (!trimmed || !password) return;

        if (!fcm_token) return alert("Generating token, please wait...");

        try {
            setIsLoading(true);
            const res = await fetch(`${backendURL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmed, password, fcm_token }),
                credentials: "include", // ✅ store httpOnly cookie
            });

            const { success, message } = await res.json();

            if (success) {
                setUsername(trimmed);
                setIsLoggedIn(true);
                localStorage.setItem("chat_user", trimmed);
                socket.emit("username", { username: trimmed });
            } else {
                setError(message || "Invalid username or password");
                setIsLoggedIn(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Server error. Try again later.");
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    const LoginSchema = Yup.object().shape({
        username: Yup.string().required("Username is required"),
        password: Yup.string().required("Password is required"),
    });

    // ✅ If toggle to signup, render SignupForm
    // if (showSignup) {
    //     return <SignupForm setIsLoggedIn={setIsLoggedIn} socket={socket}/>;
    // }
    // if(showForegetPassword){
    //     <ForgetPassword />
    // }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white shadow-2xl p-8 rounded-xl w-full max-w-sm text-center animate-fadeIn">
                <UserPlus className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Login to Chat</h2>

                <Formik
                    initialValues={{ username: "", password: "" }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ errors, touched }) => (
                        <Form>
                            {/* Username */}
                            <Field
                                name="username"
                                placeholder="Enter your username"
                                className={`w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.username && touched.username ? "border-red-500" : ""}`}
                            />
                            <ErrorMessage name="username" component="div" className="text-red-500 mb-2 text-sm" />

                            {/* Password */}
                            <Field
                                name="password"
                                type="password"
                                placeholder="Enter your password"
                                className={`w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.password && touched.password ? "border-red-500" : ""}`}
                            />
                            <ErrorMessage name="password" component="div" className="text-red-500 mb-4 text-sm" />

                            <button
                                type="submit"
                                disabled={isLoading || !fcm_token}
                                className={`w-full py-2 rounded-lg font-medium transition ${!fcm_token || isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white"}`}
                            >
                                {isLoading ? <Loader2 className="w-full h-6 animate-spin" /> : <span>Login</span>}
                            </button>
                        </Form>
                    )}
                </Formik>

                {error && <p className="text-red-500 mt-3 text-sm animate-pulse">{error}</p>}

                <div className="flex justify-between mt-4 text-sm">
                    <button
                        type="button"
                        className="text-blue-500 underline"
                        onClick={forgetPassword}
                    >
                        Forgot Password?
                    </button>

                    <button
                        type="button"
                        className="text-green-500 underline"
                        onClick={signup} // ✅ toggle to SignupForm
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}
