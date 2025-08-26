// server/Routes/userAuth.js
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const transporter = require("../config/nodemailerConfig"); // <- CJS import
const supabase = require("../config/supabaseClient");      // <- CJS import

const router = express.Router();

// Forgot Password
router.post("/forget-password", async (req, res) => {
    try {
        const { email } = req.body;

        // find user in DB
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (!user) return res.status(400).json({ error: "User not found" });

        // generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expire = Date.now() + 3600000; // 1 hour

        // save token + expire in DB
        await supabase
            .from("users")
            .update({ reset_token: token, reset_expire: expire })
            .eq("id", user.id);
            

        // send email
        const resetUrl = `http://localhost:5173/reset-password/${token}`;
        await transporter.sendMail({
            from: '"ChatterSocket Support" <salimeg30@gmail.com>',
            to: email,
            subject: "Reset your here  password",
            html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
        });


        res.json({ message: "Reset email sent" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Reset Password
router.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // find user with token
        const { data: user } = await supabase
            .from("users")
            .select("*")
            .eq("reset_token", token)
            .gt("reset_expire", Date.now())
            .single();

        if (!user) return res.status(400).json({ error: "Token expired or invalid" });

        // hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update password + clear token
        await supabase
            .from("users")
            .update({ password: hashedPassword, reset_token: null, reset_expire: null })
            .eq("id", user.id);

        res.json({ message: "Password reset successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;
