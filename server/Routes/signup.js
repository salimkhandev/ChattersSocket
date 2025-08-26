const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/supabaseClient");
require("dotenv").config();

router.post("/signup", async (req, res) => {
    console.log("📩 Signup request received:", req.body);

    try {
        const { name, username, email, password } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // check if user exists
        const { data: existingUser, error: userError } = await pool
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle(); // ✅ returns null if no user found

        if (userError) console.error("⚠️ Error checking existing user:", userError.message);

        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // insert new user
        const { data, error } = await pool
            .from("users")
            .insert([
                {
                    name,
                    username,
                    email,
                    password: hashedPassword,
                },
            ])
            .select("*")   
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        // generate JWT
        const token = jwt.sign({ id: data.id, username: data.username }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // set JWT in httpOnly cookie

        // res.cookie('userToken', token, {
        //     httponly: true,
        //     sameSite: 'None',
        //     secure: false,
        //     maxAge: 3600000 // 1 hour
        // });
        res.cookie('userToken', token, {
            httpOnly: true,       // safe, cannot be accessed via JS
            sameSite: 'lax',      // safe for localhost
            secure: true,        // must be false for http://localhost
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        // return user info only
        res.status(201).json({ message: "User created", user: data });

    } catch (err) {
        console.error("🔥 Server error:", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
