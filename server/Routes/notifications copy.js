const express = require('express');
const router = express.Router();
const supavase
// const fetch = require('node-fetch');
const admin = require('firebase-admin'); // ✅ Add this line
const supabase = require("../config/supabaseClient");

router.post('/send-notification-s', async (req, res) => {
    const { receiver, title, body, imageUrl, badgeUrl } = req.body;

// use the reciever usrname to find its id and then use it to find the token to send the message to that specific token

    try {
        const message = {
            notification: {
                title,
                body,
                image: imageUrl
            },
            webpush: {
                notification: {
                    badge: badgeUrl,
                    icon: badgeUrl
                }
            },
            token
        };

        const response = await admin.messaging().send(message);
        console.log('✅ Successfully sent message:', response);
        res.status(200).json({ success: true, response });
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
