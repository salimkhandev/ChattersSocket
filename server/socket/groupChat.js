const groups = new Set(); // Store unique group names in memory
const supabase = require("../config/supabaseClient");
function groupChat(io) {
    io.on("connection", (socket) => {
        console.log("New socket connected:", socket.id);

        socket.on("get groups", async () => {
            const { data, error } = await supabase
                .from("groups")
                .select("name, created_by");

            if (error) {
                console.error("❌ Failed to fetch groups from DB:", error.message);
                socket.emit("groups list", []);
                return;
            }

            socket.emit("groups list", data); // includes name + creator
        });

        socket.on("delete group", async ({ groupName, username }) => {
            groupName = groupName.trim().toLowerCase();

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
                    .select("name, created_by");

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
            groupName = groupName.trim().toLowerCase();
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

            // Update all users with the new group list
            io.emit("groups list", Array.from(groups));
        });


        // ✅ Join existing group
        socket.on("join group", ({ groupName, username }) => {
            groupName = groupName.trim().toLowerCase();

            if (!groupName) return;

            socket.join(groupName);

            socket.emit("group joined", {
                groupName,
                message: `${username} joined ${groupName}`,
            });

            console.log(`${username} joined group ${groupName}`);
        });



        socket.on("group message", async ({ groupName, from, message }) => {
            groupName = groupName.trim().toLowerCase();
            const sender = from.trim().toLowerCase();

            if (!groupName || !message) return;

            io.to(groupName).emit("group message", {
                from: sender,
                groupName,
                message,
            });

            console.log(`[${groupName}] ${sender}: ${message}`);

            // Store in Supabase
            const { error } = await supabase.from("group_messages").insert({
                group_name: groupName,
                sender,
                message,
            });

            if (error) {
                console.error("❌ Failed to store group message:", error);
            } else {
                console.log("💾 Group message saved to DB");
            }
        });
        socket.on("get group history", async ({ groupName }) => {
    groupName = groupName.trim().toLowerCase();

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

    socket.emit("group history", data);
});


    });
}

module.exports = groupChat;
