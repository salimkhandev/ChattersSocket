const jwt = require("jsonwebtoken");
const supabase = require("../../config/supabaseClient"); // adjust path if needed

async function autoLogin(socket) {
    try {
        const cookieHeader = socket.handshake.headers.cookie;
        // console.log("cookieHeader:", cookieHeader);

        if (!cookieHeader) {
            socket.emit("login-status", { success: false, reason: "No cookies found" });
            return;
        }

        const token = cookieHeader.split("userToken=")[1]?.split(";")[0];
        // console.log("token:", token);

        if (!token) {
            socket.emit("login-status", { success: false, reason: "No token found" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 🔍 Check if the username exists in DB
        const { data: user, error } = await supabase
            .from("users")
            .select("id, username")
            .eq("username", decoded.username)
            .single();

        if (error || !user) {
            console.warn("User not found in DB:", decoded.username);
            socket.emit("login-status", { success: false, reason: "User removed" });
            return;
        }

        // ✅ User exists
        socket.emit("login-status", {
            success: true,
            user: { id: user.id, username: user.username },
        });
    } catch (err) {
        console.error("Login check error:", err.message);
        socket.emit("login-status", { success: false, reason: "Invalid or expired token" });
    }
}

module.exports = autoLogin;
