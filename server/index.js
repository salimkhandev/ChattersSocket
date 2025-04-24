const app = require("./app");
const { server } = require("./socket");

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} 🚀`);
});
