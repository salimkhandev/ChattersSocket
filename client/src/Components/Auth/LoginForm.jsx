import React, { useEffect, useState } from 'react'
import { io } from "socket.io-client";
import { UserPlus, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext';
import { generateToken } from '../FCM/firebase'; // adjust the path
const backendURL = import.meta.env.VITE_BACKEND_URL;


// const socket = io("https://5dbb6c84-cb5e-4423-ba04-72e6a621809a-00-7sp7cj9ozrz2.spock.replit.dev/", {
//   reconnection: true,
//   reconnectionAttempts: Infinity,
//   reconnectionDelay: 2000,
// });

const socket = io(`${backendURL}`, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
});
function LoginForm({setIsLoggedIn,isLoggedIn}) {
    const [fcm_token, setFcm_token] = useState('');
    const { username, setUsername } = useAuth();
    useEffect(() => {
        const getToken = async () => {
            const token = await generateToken();
            if (token) {
                localStorage.setItem("token", token);
                setFcm_token(token);
            }
        };
        
        getToken();
    }, []);
    const [error, setError] = useState("");
    // loader
    const [isLoading, setIsLoading] = useState(false);
    // const [username, setUsername] = useState(localStorage.getItem("chat_user") || "");
    // const [isLoggedIn, setIsLoggedIn] = useState(null);


    const handleLogin = async (input) => {
        const trimmed = input.trim().toLowerCase();
        if (!trimmed) return alert("❌ Please enter a username");
     
        // Call API to check username
        try {
            setIsLoading(true);
            const res = await fetch(`${backendURL}/check-username`, {
                method: "POST",     
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: trimmed, fcm_token}),
            });

            const { success, message } = await res.json();
          

            if (success) {
                setUsername(trimmed);
                setIsLoggedIn(true);
                localStorage.setItem("chat_user", trimmed);
                socket.emit("username", { username: trimmed });
                socket.connect();
                setIsLoading(false);
                
            } else {
                setError(message || "Username not allowed");
                setIsLoggedIn(false);
                setIsLoading(false);
                
            }
        } catch (err) {
            console.error("Error checking username:", err);
            setError("Server error. Try again later.");
            setIsLoggedIn(false);
            setIsLoading(false);
        }
    };
;
    useEffect(() => {
        async function checkUsername(username) {
            try {
                const res = await fetch(`${backendURL}/check-username`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ username }),
                });

                const { success, message } = await res.json();
         

                // Set login state based on backend response
                setIsLoggedIn(success);
            } catch (err) {
                console.error("Error checking username:", err);
                setIsLoggedIn(false);
            }
        }
        checkUsername(username)

}, [isLoggedIn,username]);
    
  return (
    <div>
          <div className="bg-white shadow-2xl p-8 rounded-xl w-full max-w-sm text-center animate-fadeIn">
              <UserPlus className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Join Chat</h2>
              <input
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter your username"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin(e.target.value)}
              />
              <button
                  onClick={(e) => handleLogin(e.target.previousElementSibling?.value || "")}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition"
              >
                {isLoading ? <Loader2 className="w-full h-6 animate-spin" /> : <span>Join</span>} 
              </button>
              {error && <p className="text-red-500 mt-3 text-sm animate-pulse">{error}</p>}
          </div>
    </div>
  )
}

export default LoginForm
