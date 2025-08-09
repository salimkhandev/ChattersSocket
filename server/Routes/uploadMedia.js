const express = require("express");
const cloudinary = require('../config/cloudinaryConfig');
const multer = require("multer");
const fs = require("fs");
const path = require("path"); // Required to extract file extension
const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/upload-media", upload.single("file"), async (req, res) => {
    try {
        const filePath = req.file.path;
console.log({filePath});

        // Upload to Cloudinary with auto resource type
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });

        // Delete local temp file

        // Extract format from original filename if Cloudinary doesn't return it
        const fileExt = path.extname(req.file.originalname).toLowerCase().replace(".", ""); // e.g., "zip"
        const format = result.format || fileExt;

        return res.json({
            media_url: result.secure_url,
            resource_type: result.resource_type,       // "image", "video", or "raw"
            format: format,                            // always set, fallback to file extension
            original_filename: result.original_filename,
            public_id: result.public_id,
        });
    } catch (err) {
        console.error("Upload Error:", err);
        fs.unlinkSync(filePath);
        return res.status(500).json({ error: "Upload failed" });
    }
});

module.exports = router;
