let user = [
    {
        conversation_id: 1,
        id: 19,
        username: "salim30",
        fName: "Salim Khan",
        profile_pic: "…",
        isOnline: true,
        unseenCount: 2, // 👈
    },
    {
        conversation_id: 3,
        id: 35,
        username: "gul",
        fName: "Gul Khan",
        profile_pic: "…",
        isOnline: false,
        unseenCount: 0, // 👈
    },
];
// unseen count for this user
 user.map((value)=>{
    
     console.log(value.username, "=> unseen:", value.unseenCount);
})

