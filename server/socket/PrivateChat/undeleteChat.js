async function undeleteChat({ supabase, conversationId, userId }) {
    try {
        // Get current deleted_by
        const { data: convo, error: fetchErr } = await supabase
            .from("conversations")
            .select("deleted_by")
            .eq("conversation_id", conversationId)
            .single();

        if (fetchErr || !convo) return;

        // Remove user from deleted_by array
        const updatedDeletedBy = (convo.deleted_by || []).filter(id => id !== userId);

        // Update the conversation
        await supabase
            .from("conversations")
            .update({ deleted_by: updatedDeletedBy })
            .eq("conversation_id", conversationId);

        console.log(`User ${userId} undeleted conversation ${conversationId}`);
    } catch (err) {
        console.error("Error undeleting chat:", err);
    }
}

module.exports = { undeleteChat };
