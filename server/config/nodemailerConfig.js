// server/config/nodemailerConfig.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // in .env
        pass: process.env.EMAIL_PASS, // Gmail App Password
    },
});

module.exports = transporter;
