import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
const backendURL = import.meta.env.VITE_BACKEND_URL;
// import LoginForm from "./LoginForm";
import { useAuth } from "../../context/AuthContext";

export default function SignupForm({ socket, LoginForm }) {
    const [serverError, setServerError] = useState("");
    const navigate = useNavigate();
    const [showLogin, setShowLogin] = useState(false);
    const { setUsername, setIsLoggedIn}=useAuth();

    const SignupSchema = Yup.object().shape({
        name: Yup.string().required("Full Name is required"),
        username: Yup.string().required("Username is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
        password: Yup.string()
            .min(6, "Password must be at least 6 characters")
            .required("Password is required"),
    });

    // if (showLogin) {
    //     return <LoginForm setIsLoggedIn={setIsLoggedIn} setShowLogin={setShowLogin} />;
    // }


    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
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
                    <Form className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>

                        {serverError && (
                            <div className="text-red-600 text-center mb-4">{serverError}</div>
                        )}

                        {/* Full Name */}
                        <label className="block mb-2 font-medium">Full Name</label>
                        <Field
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            className={`w-full p-3 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.name && touched.name ? "border-red-500" : ""
                                }`}
                        />
                        <ErrorMessage
                            name="name"
                            component="div"
                            className="text-red-500 mb-2 text-sm"
                        />

                        {/* Username */}
                        <label className="block mb-2 font-medium">Username</label>
                        <Field
                            type="text"
                            name="username"
                            placeholder="Enter your username"
                            className={`w-full p-3 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.username && touched.username ? "border-red-500" : ""
                                }`}
                        />
                        <ErrorMessage
                            name="username"
                            component="div"
                            className="text-red-500 mb-2 text-sm"
                        />

                        {/* Email */}
                        <label className="block mb-2 font-medium">Email</label>
                        <Field
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            className={`w-full p-3 mb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.email && touched.email ? "border-red-500" : ""
                                }`}
                        />
                        <ErrorMessage
                            name="email"
                            component="div"
                            className="text-red-500 mb-2 text-sm"
                        />

                        {/* Password */}
                        <label className="block mb-2 font-medium">Password</label>
                        <Field
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            className={`w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.password && touched.password ? "border-red-500" : ""
                                }`}
                        />
                        <ErrorMessage
                            name="password"
                            component="div"
                            className="text-red-500 mb-4 text-sm"
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {isSubmitting ? "Signing Up..." : "Sign Up"}
                        </button>

                        <p className="text-center mt-4">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={LoginForm}
                                className="text-blue-500 underline"
                            >
                                Log In
                            </button>
                        </p>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
