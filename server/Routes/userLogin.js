const express = require("express");
const supabase = require("../config/supabaseClient");
const router = express.Router();

router.post('/check-username', async (req, res) => {
    const { username, fcm_token } = req.body;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required." });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name')
            .eq('username', username)
            .single();

        if (error || !user) {
            return res.status(200).json({
                success: false,
                message: `User "${username}" is not allowed to join.`,
            });
        }

        // Handle FCM token insert
        let tokenStatus = "No FCM token provided.";
        if (fcm_token) {
            const { error: tokenError } = await supabase
                .from('fcm_tokens')
                .upsert(
                    [{ user_id: user.id, token: fcm_token }],
                    { onConflict: ['token'] } // only conflict on token
                );

            tokenStatus = tokenError ? "FCM token insertion failed." : "FCM token stored successfully.";
        }
        

console.log(tokenStatus);

        return res.status(200).json({
            success: true,
            message: `User ${username} is allowed to join.`,
            user,
            tokenStatus,
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
