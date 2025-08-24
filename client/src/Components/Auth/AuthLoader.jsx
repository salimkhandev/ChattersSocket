import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AuthLoader({ socket }) {
    const { setUsername, setIsLoggedIn, setCheckingAuth } = useAuth();

    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            socket.emit("check-login");
        };

        const handleLoginStatus = (data) => {
            if (data.success) {
                setUsername(data.user.username);
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
            setCheckingAuth(false);
        };

        // 👇 Run immediately if already connected
        if (socket.connected) {
            handleConnect();
        }

        socket.on("connect", handleConnect);
        socket.on("login-status", handleLoginStatus);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("login-status", handleLoginStatus);
        };
    }, [socket]);


    return null; // does not render anything
}
