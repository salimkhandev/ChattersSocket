import React, { useEffect, useState } from 'react';
// import { io } from "socket.io-client";
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { generateToken } from '../FCM/firebase'; // adjust path
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
// import SignupForm from './SignupForm';
// import ForgetPassword from './ForgetPassword';

const backendURL = import.meta.env.VITE_BACKEND_URL;

// const socket = io(`${backendURL}`, {
//     reconnection: true,
//     reconnectionAttempts: Infinity,
//     reconnectionDelay: 2000,
// });

export default function LoginForm({ setIsLoggedIn, forgetPassword, signup, socket }) {
    const { setUsername } = useAuth();
    const [fcm_token, setFcm_token] = useState(localStorage.getItem("token") || '');
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="bg-white shadow-2xl p-6 sm:p-8 lg:p-10 rounded-xl 
                w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-1xl xl:max-w-2xl text-center animate-fadeIn">
            {/* <div className="bg-white shadow-2xl p-6 sm:p-8 lg:p-10 rounded-xl w-full max-w-sm sm:max-w-md lg:max-w-2xl xl:max-w-3xl text-center animate-fadeIn"> */}
                <UserPlus className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-600 mx-auto mb-4 sm:mb-6" />
                <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6 sm:mb-8">Login to Chat</h2>

                <Formik
                    initialValues={{ username: "", password: "" }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ errors, touched }) => (
                        <Form className="space-y-4">
                            {/* Username */}
                            <div>
                                <Field
                                    name="username"
                                    placeholder="Enter your username"
                                    className={`w-full border rounded-lg px-4 py-3 sm:py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-sm sm:text-base ${errors.username && touched.username
                                            ? "border-red-500 bg-red-50"
                                            : "border-gray-300 hover:border-gray-400"
                                        }`}
                                />
                                <ErrorMessage
                                    name="username"
                                    component="div"
                                    className="text-red-500 mt-1 text-xs sm:text-sm text-left"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="relative">
                                    <Field
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        className={`w-full border rounded-lg px-4 py-3 sm:py-4 pr-12 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 text-sm sm:text-base ${errors.password && touched.password
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-300 hover:border-gray-400"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
                                        ) : (
                                            <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                                        )}
                                    </button>
                                </div>
                                <ErrorMessage
                                    name="password"
                                    component="div"
                                    className="text-red-500 mt-1 text-xs sm:text-sm text-left"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !fcm_token}
                                className={`w-full py-3 sm:py-4 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-2 ${!fcm_token || isLoading
                                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                                        : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 text-white transform hover:scale-[1.02]"
                                    }`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mr-2" />
                                        <span>Logging in...</span>
                                    </div>
                                ) : (
                                    <span>Login</span>
                                )}
                            </button>
                        </Form>
                    )}
                </Formik>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-500 text-xs sm:text-sm animate-pulse">{error}</p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 space-y-2 sm:space-y-0 text-xs sm:text-sm">
                    <button
                        type="button"
                        className="text-blue-500 underline hover:text-blue-600 focus:text-blue-600 focus:outline-none transition-colors duration-200 font-medium"
                        onClick={forgetPassword}
                    >
                        Forgot Password?
                    </button>

                    <button
                        type="button"
                        className="text-green-500 underline hover:text-green-600 focus:text-green-600 focus:outline-none transition-colors duration-200 font-medium"
                        onClick={signup} // ✅ toggle to SignupForm
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        // </div>
    );
}