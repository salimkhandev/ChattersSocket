const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabaseClient");
const router = express.Router();



router.post('/check-username', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required." });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('name')
            .eq('username', username)
            .single();

        if (error || !data) {
            return res.status(200).json({
                success: false,
                message: `User "${username}" is not allowed to join.`,
            });
        }

        return res.status(200).json({
            success: true,
            message: `User ${username} is allowed to join.`,
            user: data,
        });

    } catch (err) {
        console.error('Supabase error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
});





module.exports = router;