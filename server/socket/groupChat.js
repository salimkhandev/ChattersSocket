const groups = new Set(); // Store unique group names in memory
const supabase = require("../config/supabaseClient");
const redisClient = require("../config/redisConfig");
function groupChat(io) {
    io.on("connection", (socket) => {

        socket.on("get groups", async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("*");

            if (error) {
                console.error("❌ Failed to fetch groups from DB:", error.message);
                socket.emit("groups list", []);
                return;
            }

            socket.emit("groups list", data); // includes name + creator
        });

        socket.on("delete group", async ({ groupName, username }) => {
            groupName = groupName.trim()

            if (!groupName || !username) return;

            // Optional: confirm the user is the creator before deleting
            const { data: groupData, error: fetchError } = await supabase
                .from("groups")
                .select("*")
                .eq("name", groupName)
                .single();

            if (fetchError || !groupData) {
                return socket.emit("group delete failed", {
                    message: "Group not found.",
                });
            }

            if (groupData.created_by !== username) {
                return socket.emit("group delete failed", {
                    message: "You are not allowed to delete this group.",
                });
            }

            // First, delete all messages in this group
            const { error: deleteMessagesError } = await supabase
                .from("group_messages")
                .delete()
                .eq("group_name", groupName);

            if (deleteMessagesError) {
                console.error("❌ Failed to delete group messages:", deleteMessagesError.message);
                return socket.emit("group delete failed", {
                    message: "Failed to delete group messages.",
                });
            }


            const { error } = await supabase
                .from("groups")
                .delete()
                .eq("name", groupName)
                .eq("created_by", username);

            if (error) {
                socket.emit("group delete failed", {
                    message: "Failed to delete group.",
                });
            } else {
                // Remove from in-memory set if you use one
                groups.delete(groupName);

                // Notify all clients
                socket.emit("group delete success", {
                    groupName,
                });

                const { data: updatedGroups, error: fetchErr } = await supabase
                    .from("groups")
                    .select("*");

                if (fetchErr) {
                    console.error("❌ Failed to fetch updated groups:", fetchErr.message);
                    return;
                }

                io.emit("groups list", updatedGroups);
                console.log(`Group "${groupName}" deleted by ${username}`);
            }
        });



        // ✅ Create and join group
        socket.on("create group", async ({ groupName, username }) => {
            groupName = groupName.trim();
            if (!groupName) return;

            // Add group to memory
            groups.add(groupName);

            // ✅ Store group in Supabase
            const { error } = await supabase
                .from("groups")
                .insert([{ name: groupName, created_by: username }]);

            if (error && error.code !== '23505') { // 23505 = unique_violation
                console.error("❌ Failed to save group to DB:", error.message);
            }

            // Join the socket to the group
            socket.join(groupName);

            // Notify the user
            socket.emit("group joined", {
                groupName,
                message: `${username} created and joined ${groupName}`,
            });

            console.log(`${username} created and joined group: ${groupName}`);
            const { data: updatedGroups, error: fetchErr } = await supabase
                .from("groups")
                .select("*");

            if (fetchErr) {
                console.error("❌ Failed to fetch updated groups:", fetchErr.message);
                return;
            }

            // ✅ Send full group data to all clients
            io.emit("groups list", updatedGroups);
        });


        // ✅ Join existing group
        socket.on("join group", ({ groupName, username }) => {
            groupName = groupName.trim()

            if (!groupName) return;

            socket.join(groupName);

            socket.emit("group joined", {
                groupName,
                message: `${username} joined ${groupName}`,
            });

            console.log(`${username} joined group ${groupName}`);
        });

        socket.on("delete for me group message", async ({ username, messageId }) => {
            try {
                // Step 1: Fetch current deleted_for array
                const { data: message, error: fetchError } = await supabase
                    .from("group_messages")
                    .select("deleted_for")
                    .eq("id", messageId)
                    .single();

                if (fetchError || !message) {
                    console.error("❌ Message not found:", fetchError);
                    return;
                }

                const deletedForUsers = message.deleted_for || [];

                // Step 2: Add user if not already there
                if (!deletedForUsers.includes(username)) {
                    deletedForUsers.push(username);
                }

                // Step 3: Update message with new array
                const { error: updateError } = await supabase
                    .from("group_messages")
                    .update({ deleted_for: deletedForUsers })
                    .eq("id", messageId);

                if (updateError) {
                    console.error("❌ Failed to update deleted_for:", updateError);
                } else {
                    socket.emit("message deleted for me", { messageId });
                }

            } catch (err) {
                console.error("❌ Error in delete for me:", err);
            }
        });


        async function sendGroupHistory(io, socket, groupName) {
            const { data, error } = await supabase
                .from("group_messages")
                .select("*")
                .eq("group_name", groupName)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("❌ Error fetching group history:", error);
                socket.emit("group history", []);
                return;
            }

            io.to(groupName).emit("group history", data);
        }
        socket.on("edit group message", async ({ messageId, newMessage, groupName }) => {
            function getPakistanISOString() {
                const now = new Date();
                const offsetMs = 5 * 60 * 60 * 1000; // +5 hours in milliseconds
                const pakistanDate = new Date(now.getTime() + offsetMs);
                return pakistanDate.toISOString().replace('Z', '+05:00');
            }

            try {
                const { error: updateError } = await supabase
                    .from("group_messages")
                    .update({
                        message: newMessage,
                        updated: true,
                        updated_at: getPakistanISOString(),
                    })
                    .eq("id", messageId);

                if (updateError) {
                    console.error("Failed to update group message:", updateError);
                } else {
                    // ✅ Emit fresh group chat history to all in the group
                    await sendGroupHistory(io, socket, groupName);
                }

            } catch (err) {
                console.error("Edit exception:", err.message);
            }
        });


        socket.on("delete for everyone group message", async ({ username, messageId, groupName }) => {
            try {
                groupName = groupName.trim();

                // Verify sender
                const { data: message, error } = await supabase
                    .from("group_messages")
                    .select("sender")
                    .eq("id", messageId)
                    .single();

                if (error || !message) {
                    console.error("Message not found:", error);
                    return;
                }

                if (message.sender !== username) {
                    console.warn("Unauthorized delete attempt by", username);
                    return;
                }

                // Update DB
                const { error: updateError } = await supabase
                    .from("group_messages")
                    .update({ is_deleted_for_everyone: true })
                    .eq("id", messageId);

                if (updateError) {
                    console.error("Failed to delete for everyone:", updateError);
                } else {
                    // ✅ Emit fresh chat history
                    await sendGroupHistory(io, socket, groupName);
                }

            } catch (err) {
                console.error("Error in delete for everyone:", err);
            }
        });

        socket.on("group message", async ({ groupName, from, message }) => {
            try {


                const sender = from.trim().toLowerCase();
                const created_at = new Date().toISOString();
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("name, profile_pic")
                    .eq("username", sender)
                    .single();

                if (userError || !userData) {
                    console.error("❌ Failed to fetch user data from DB:", userError?.message);
                    return;
                }

                const senderfullname = userData.name;
                const sender_profile_pic = userData.profile_pic;

                if (!groupName || !message) return;

                // 1. Save message to Supabase
                const { data: insertData, error: insertError } = await supabase
                    .from("group_messages")
                    .insert({
                        group_name: groupName,
                        sender,
                        message,
                        created_at, // ensure we insert the same timestamp
                        // senderfullname: senderfullname,
                    })
                    .select()
                    .single(); // this returns the inserted row directly

                if (insertError || !insertData) {
                    console.error("❌ Failed to store group message:", insertError?.message);
                    return;
                }

                console.log("💾 Group message saved to DB");

                // 2. Construct response object using returned data
                const responseObject = {
                    id: insertData.id,
                    from: sender,
                    senderfullname: senderfullname,
                    sender_profile_pic: sender_profile_pic,
                    groupName,
                    message: insertData.message,
                    created_at: insertData.created_at,
                    deleted_for: insertData.deleted_for,
                    is_deleted_for_everyone: insertData.is_deleted_for_everyone,
                };

                // 3. Emit message to group only after DB save
                io.to(groupName).emit("group message", responseObject);
                console.log("responseObject", responseObject);
                console.log(`[${groupName}] ${sender}: ${message}`);

            } catch (err) {
                console.error("❌ Unexpected error in group message handler:", err.message);
            }
        });

        socket.on("get group history", async ({ groupName }) => {
            groupName = groupName.trim()

            const { data, error } = await supabase
                .from("group_messages")
                .select("*")
                .eq("group_name", groupName)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("❌ Error fetching group history:", error);
                socket.emit("group history", []);
                return;
            }

            // console.log('get group history🚚',{data})
            socket.emit("group history", data);
        });



    });
}

module.exports = groupChat;
