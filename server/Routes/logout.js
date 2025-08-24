
const express = require("express");
const router = express.Router();

router.post("/logout", (req, res) => {
    
    console.log("User logged out");
    res.clearCookie('userToken');
    return res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
  
