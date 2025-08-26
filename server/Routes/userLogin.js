const express = require("express");
const supabase = require("../config/supabaseClient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();

router.post("/login", async (req, res) => {
    const { username, password, fcm_token } = req.body;
console.log("Login request received for user:", username)   
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    try {
        // 1. Find user by username
        const { data: users, error: userError } = await supabase
            .from("users")
            .select("id, username, password, name")
            .eq("username", username.toLowerCase());

        if (userError) {
            console.error("DB error:", userError);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        if (!users || users.length === 0) {
            return res.status(401).json({ success: false, message: "User not found." });
        }

        const user = users[0];

        // 2. Compare password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: "Invalid password." });
        }

        // 3. Generate JWT
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });


        // res.cookie('userToken', token, {
        //     httponly: true, 
        //     sameSite: 'None',
        //     secure: false,
        //     maxAge: 3600000 // 1 hour
        // });
        res.cookie('userToken', token, {
            httpOnly: true,       // safe, cannot be accessed via JS
            sameSite: 'lax',      // safe for localhost
            secure: false,        // must be false for http://localhost
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // 5. Handle FCM token
        let tokenStatus = "No FCM token provided.";
        if (fcm_token) {
            const { error: tokenError } = await supabase
                .from("fcm_tokens")
                .upsert(
                    [{ user_id: user.id, token: fcm_token }],
                    { onConflict: ["token"] }
                );

            tokenStatus = tokenError ? "FCM token insertion failed." : "FCM token stored successfully.";
        }

        // 6. Return user info only
        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.username}!`,
            user: { id: user.id, username: user.username, name: user.name },
            tokenStatus,
        });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;
