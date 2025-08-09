// utils/sendNotification.js
const admin = require('firebase-admin');
const supabase = require('../config/supabaseClient');

const sendNotification = async ({ receiver, title, body, imageUrl, badgeUrl }) => {
    try {
        // Step 1: Get user ID
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('username', receiver)
            .single();

        if (userError || !userData) {
            throw new Error('User not found');
        }

        const userId = userData.id;

        // Step 2: Get all FCM tokens for that user
        const { data: tokenData, error: tokenError } = await supabase
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', userId);

        if (tokenError || !tokenData?.length) {
            throw new Error('FCM tokens not found');
        }

        const tokens = tokenData.map(row => row.token);
        console.log('🚀 ~ sendNotification ~ tokens:', tokens);

        // Step 3: Build the multicast message
        const message = {
            notification: {
                title,
                body,
                ...(imageUrl && { image: imageUrl }),
            },
            webpush: {
                notification: {
                    ...(badgeUrl && { badge: badgeUrl }),
                    ...(badgeUrl && { icon: badgeUrl }),
                },
            },
            tokens,
        };

        // Step 4: Send using `sendEachForMulticast`
        const response = await admin.messaging().sendEachForMulticast(message);

        console.log(`✅ Notification sent: ${response.successCount} successes, ${response.failureCount} failures`);

        // Step 5: Remove invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = response.responses
                .map((res, idx) => (!res.success ? tokens[idx] : null))
                .filter(t => t !== null);

            if (failedTokens.length) {
                console.warn('⚠️ Removing invalid tokens:', failedTokens);
                await supabase
                    .from('fcm_tokens')
                    .delete()
                    .in('token', failedTokens);
            }
        }

        return { success: true, response };
    } catch (error) {
        console.error('❌ Notification error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = sendNotification;
