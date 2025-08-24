module.exports = (io) => {
    io.on("connection", (socket) => {
        socket.on("check-login", () => {
            console.log("check login 😂😂😂:", socket.id);
            try {
                const cookieHeader = socket.handshake.headers.cookie;
                console.log("cookieHeader:", cookieHeader);
                if (!cookieHeader) return socket.emit("login-status", { success: false });

                const token = cookieHeader.split("userToken=")[1]?.split(";")[0];
                // console.log("token:", token);
                if (!token) return socket.emit("login-status", { success: false });

                const jwt = require("jsonwebtoken");
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                socket.emit("login-status", {
                    success: true,
                    user: { id: decoded.id, username: decoded.username },
                });
            } catch (err) {
                console.error("Login check error:", err.message);
                socket.emit("login-status", { success: false });
            }
        });
    });
};
