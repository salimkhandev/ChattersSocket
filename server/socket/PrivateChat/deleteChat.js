async function deleteChat({ supabase, conversationId, userId, socket }) {
    try {
        // Get current deleted_by
        const { data: convo } = await supabase
            .from("conversations")
            .select("deleted_by")
            .eq("conversation_id", conversationId)
            .single();

        // Compute new deleted_by and update
        const updatedDeletedBy = Array.from(new Set([...(convo?.deleted_by || []), userId]));

        await supabase
            .from("conversations")
            .update({ deleted_by: updatedDeletedBy })
            .eq("conversation_id", conversationId);

        // Notify client immediately
        socket.emit("chatDeleted", { conversationId, userId });

        // If both users deleted, remove all related data`
        if (updatedDeletedBy.length === 2) {
            await supabase
                .from("messages")
                .delete()
                .eq("conversation_id", conversationId);

            await supabase
                .from("conversations")
                .delete()
                .eq("conversation_id", conversationId);
        }
    } catch (err) {
        socket.emit("deleteChatError", { conversationId, error: err.message });
    }
}

module.exports = { deleteChat };