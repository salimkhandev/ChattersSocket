const { createClient } = require("redis");

const redisClient = createClient({
    url: "rediss://default:AVNGAAIjcDE2ZjdkYjExYTkwZDM0MDJmODIwY2QyNzcxODFiOTI4NHAxMA@whole-gelding-21318.upstash.io:6379"
});

redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err);
});
redisClient.connect()
    .then(() => console.log("✅ Redis connected"))
    .catch((err) => console.error("Redis connection failed:", err));
    
module.exports = redisClient;
