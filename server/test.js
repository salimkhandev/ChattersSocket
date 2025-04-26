// custom data
const connectedUsers = {
    alice: true,
    bob: false,
    charlie: 'isdof823904823jdeeoi',
    david: 'wqjqwjqi',
    emma: 'asasa'
};

// your code
const onlineUsers = Object.keys(connectedUsers).filter(user => connectedUsers[user]);

console.log(onlineUsers); // Output: ["alice", "charlie", "emma"]
