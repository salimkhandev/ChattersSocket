const connectedUsers = {
    user1: true,
    user2: false,
    user3: true
};

const onlineUsers = Object.keys(connectedUsers).filter(user => connectedUsers.user===true);
console.log(onlineUsers); // ["user1", "user3"]
