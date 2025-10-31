const { createClient } = require("redis");

const redisClient = createClient({
    url: "rediss://default:AXt0AAIncDI0ZDk1M2ViZjA1MTA0OTg5ODdhNWIwYmMwMDI1NThhNXAyMzE2MDQ@whole-ocelot-31604.upstash.io:6379",
    socket: {
        tls: true,
        rejectUnauthorized: false
    }
});

redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err);
});
redisClient.connect()
    .then(() => console.log("✅ Redis connected"))
    .catch((err) => console.error("Redis connection failed:", err));
    
module.exports = redisClient;
