const unseenMessages = [
    { sender: "ali", receiver: "salim", unseen_count: 3 },
    { sender: "zara", receiver: "salim", unseen_count: 1 }
];

const onlineUsers = [
    {
        username: "zara",
        fName: "Zara Khan",
        profilePic: "https://supabase.co/pic/zara.png"
    },
    {
        username: "ahmad",
        fName: "Ahmad",
        profilePic: "https://supabase.co/pic/ahmad.png"
    }
];
const enrichedOnlineUsers = onlineUsers.map(user => {
    const match = unseenMessages.find(msg => msg.sender === user.username);

    return {
        username: user.username,
        fName: user.fName,
        profilePic: user.profilePic,
        unseen_count: match ? match.unseen_count : 0,
        receiver: match ? match.receiver : null
    };
});

console.log(enrichedOnlineUsers);
