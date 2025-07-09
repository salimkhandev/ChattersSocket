// // utils.js

// const redisClient = require("../config/redisConfig");

// // ✅ Normalize any username for consistency
// function normalizeUsername(username) {
//     return username?.trim().toLowerCase();
// }

// // ✅ Get a socket ID of a user from Redis
// async function getSocketId(username) {
//     const userData = await redisClient.hGet("connectedUsers", normalizeUsername(username));
//     if (!userData) return null;
//     try {
//         const parsed = JSON.parse(userData);
//         return parsed.socketId || null;
//     } catch (e) {
//         console.error("Error parsing socketId for:", username);
//         return null;
//     }
// }

// // ✅ Get all online usernames from Redis (socketId !== null)
// async function getOnlineUsernames() {
//     const allUsers = await redisClient.hGetAll("connectedUsers");
//     return Object.keys(allUsers).filter((username) => {
//         try {
//             const user = JSON.parse(allUsers[username]);
//             return user.socketId !== null;
//         } catch (e) {
//             return false;
//         }
//     });
// }

// // ✅ Update socketId for user in Redis
// async function updateUserSocketId(username, socketId) {
//     const normalized = normalizeUsername(username);
//     await redisClient.hSet("connectedUsers", normalized, JSON.stringify({ username: normalized, socketId }));
// }

// // ✅ Mark user as disconnected (socketId = null)
// async function markUserDisconnected(socketId) {
//     const allUsers = await redisClient.hGetAll("connectedUsers");
//     for (let username in allUsers) {
//         try {
//             const userData = JSON.parse(allUsers[username]);
//             if (userData.socketId === socketId) {
//                 await redisClient.hSet("connectedUsers", username, JSON.stringify({ username, socketId: null }));
//                 return username;
//             }
//         } catch (e) {
//             console.error("Error in markUserDisconnected for", username);
//         }
//     }
//     return null;
// }

// module.exports = {
//     normalizeUsername,
//     getSocketId,
//     getOnlineUsernames,
//     updateUserSocketId,
//     markUserDisconnected,
// };

const supabase = require("../config/supabaseClient");

async function createGroup(name, createdBy) {
    const { data, error } = await supabase
        .from("groups")
        .insert([{ name, created_by: createdBy }])
        .select()
        .single();

    if (error && error.code !== '23505') {
        // 23505 = unique constraint violation
        console.error("Error creating group:", error.message);
        return null;
    }

    return data;
}

async function getAllGroups() {
    const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching groups:", error.message);
        return [];
    }

    return data;
}

module.exports = { createGroup, getAllGroups };

