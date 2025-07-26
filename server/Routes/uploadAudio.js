const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinaryConfig');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload-audio', upload.single('audio'), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload_stream(
            {
                resource_type: "video", // audio is treated as video
                folder: "voiceMessages"
            },
            (error, result) => {
                if (error) return res.status(500).json({ error });
                res.status(200).json({ audio_url: result.secure_url });
            }
        );
        result.end(req.file.buffer);
    } catch (err) {
        res.status(500).json({ error: "Upload failed" });
    }
});

module.exports = router;
