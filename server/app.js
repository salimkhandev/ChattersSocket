const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to ChatterSocket! we are live" });
});

module.exports = app;