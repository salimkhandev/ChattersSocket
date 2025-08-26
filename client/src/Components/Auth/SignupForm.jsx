import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
const backendURL = import.meta.env.VITE_BACKEND_URL;
import { useAuth } from "../../context/AuthContext";

export default function SignupForm({ socket, LoginForm }) {
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { setUsername, setIsLoggedIn} = useAuth();

    const SignupSchema = Yup.object().shape({
        name: Yup.string().required("Full Name is required"),
        username: Yup.string().required("Username is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
        password: Yup.string()
            .min(6, "Password must be at least 6 characters")
            .required("Password is required"),
    });

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className=" p-6 sm:p-8 lg:p-10 rounded-xl 
                w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl text-center animate-fadeIn">
            {/* <div className="bg-white shadow-2xl p-6 sm:p-8 lg:p-10 rounded-xl w-full max-w-sm sm:max-w-md lg:max-w-2xl xl:max-w-3xl text-center animate-fadeIn">   */}
                          <Formik
                initialValues={{
                    name: "",
                    username: "",
                    email: "",
                    password: "",
                }}
                validationSchema={SignupSchema}
                onSubmit={async (values, { setSubmitting }) => {
                    setServerError(""); // reset error
                    try {
                        const res = await fetch(`${backendURL}/signup`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(values),
                            credentials: "include", 
                        });

                        const data = await res.json();

                        if (!res.ok) {
                            setServerError(data.error || "Signup failed");
                            return;
                        }

                        // success
                        localStorage.setItem("token", data.token);
                        setIsLoggedIn(true);
                        setUsername(values.username)
                        setIsLoggedIn(true);
                        socket.emit("username", { username: values.username });
                    } catch (err) {
                        setServerError("Server error: " + err.message);
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({ errors, touched, isSubmitting }) => (
                    <Form className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full 
    max-w-md sm:max-w-lg md:max-w-xl lg:max-w-1xl xl:max-w-2xl mx-auto">

                        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">Sign Up</h2>

                        {serverError && (
                            <div className="text-red-600 text-center mb-4 p-3 bg-red-50 rounded-lg border border-red-200 text-sm sm:text-base">
                                {serverError}
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="mb-4">
                         
                            <Field
                                type="text"
                                name="name"
                                placeholder="Enter your full name"
                                className={`w-full p-3 sm:p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-sm sm:text-base ${
                                    errors.name && touched.name 
                                        ? "border-red-500 bg-red-50" 
                                        : "border-gray-300 hover:border-gray-400"
                                }`}
                            />
                            <ErrorMessage
                                name="name"
                                component="div"
                                className="text-red-500 mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        {/* Username */}
                        <div className="mb-4">
                      
                            <Field
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                className={`w-full p-3 sm:p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-sm sm:text-base ${
                                    errors.username && touched.username 
                                        ? "border-red-500 bg-red-50" 
                                        : "border-gray-300 hover:border-gray-400"
                                }`}
                            />
                            <ErrorMessage
                                name="username"
                                component="div"
                                className="text-red-500 mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                      
                            <Field
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                className={`w-full p-3 sm:p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-sm sm:text-base ${
                                    errors.email && touched.email 
                                        ? "border-red-500 bg-red-50" 
                                        : "border-gray-300 hover:border-gray-400"
                                }`}
                            />
                            <ErrorMessage
                                name="email"
                                component="div"
                                className="text-red-500 mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                          
                            <div className="relative">
                                <Field
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    className={`w-full p-3 sm:p-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-sm sm:text-base ${
                                        errors.password && touched.password 
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
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <ErrorMessage
                                name="password"
                                component="div"
                                className="text-red-500 mt-1 text-xs sm:text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-500 text-white py-3 sm:py-4 rounded-lg hover:bg-blue-600 focus:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
                        >
                            {isSubmitting ? "Signing Up..." : "Sign Up"}
                        </button>

                        <p className="text-center mt-6 text-sm sm:text-base text-gray-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={LoginForm}
                                className="text-blue-500 underline hover:text-blue-600 focus:text-blue-600 focus:outline-none transition-colors duration-200 font-medium"
                            >
                                Log In
                            </button>
                        </p>
                    </Form>
                )}
            </Formik>
        {/* </div> */}
        </div>
    );
}