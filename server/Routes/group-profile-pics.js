const express = require("express");
const multer = require("multer");
const supabase = require("../config/supabaseClient");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Multer setup to handle image file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Update full name of user
router.post("/update-group-name", async (req, res) => {
    const { groupID, groupName } = req.body;

    if (!groupID || !groupName) {
        return res.status(400).json({ error: "Group ID and group name are required" });
    }

    const { data, error } = await supabase
        .from("groups")
        .update({ name: groupName })
        .eq("id", groupID)
        .select("name") // return only the updated name
        .single(); // get a single object, not array

    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, groupName: data.name });
});




// Get profile picture for a user
router.get("/get-group-profile-pic/:groupID", async (req, res) => {
    const { groupID } = req.params;


    if (!groupID) {
        return res.status(400).json({ error: "Group ID is required" });
    }

    const { data, error } = await supabase

        .from("groups")
        .select("profile_pic")
        .eq("id", groupID)
        .single();

    if (error) return res.status(500).json({ error: error.message });

    if (!data?.profile_pic) {
        return res.status(404).json({ error: "Profile picture not found" });
    }

    res.json({ profilePicUrl: data });
});


router.post("/upload-group-profile-pic", upload.single("file"), async (req, res) => {
    const { groupID } = req.body;
    const file = req.file;

    // console.log('File is ',file);


    if (!groupID || !file) {
        return res.status(400).json({ error: "Group ID and file are required" });
    }

    // 1. Fetch current profile_pic URL from DB
    const { data: groupData, error: fetchError } = await supabase

        .from("groups")
        .select("profile_pic")
        .eq("id", groupID)
        .single();


    if (fetchError) {
        console.error("Failed to fetch existing image:", fetchError.message);
    }

    // 2. Delete old image from Supabase if exists
    if (groupData?.profile_pic) {
        console.log('the path of the log is ', groupData.profile_pic);

        const oldImagePath = groupData.profile_pic.split(
            "/storage/v1/object/public/profile-pics/"
        )[1];

        // console.log('old Image path is',oldImagePath);



        if (oldImagePath) {
            const { error: deleteOldError } = await supabase.storage
                .from("profile-pics")
                .remove([oldImagePath]);

            if (deleteOldError) {
                console.error("Failed to delete old image:", deleteOldError.message);
            }
        }
    }

    // 3. Upload new image
    const fileName = `${uuidv4()}-${file.originalname}`;

    const { error: uploadError } = await supabase.storage
        .from("group-profile-pics")
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false, // don't overwrite if file with same name exists
        });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/group-profile-pics/${fileName}`;

    // 4. Update new URL in DB
    const { error: dbError } = await supabase
        .from("groups")
        .update({ profile_pic: publicURL })
        .eq("id", groupID);

    if (dbError) return res.status(500).json({ error: dbError.message });

    res.json({ success: true, profilePicUrl: publicURL });
});


// Delete Profile Picture (fetch path from DB using username)
router.post("/delete-group-profile-pic", async (req, res) => {
    const { groupID } = req.body;

    if (!groupID) {
        return res.status(400).json({ error: "Group ID is required" });
    }

    // 1. Get the user's current profile picture URL
    const { data, error: fetchError } = await supabase
        .from("groups")
        .select("profile_pic")
        .eq("id", groupID)
        .single();

    if (fetchError) return res.status(500).json({ error: fetchError.message });

    if (!data?.profile_pic) {
        return res.status(404).json({ error: "No profile picture found for group" });
    }

    // 2. Extract the image path from the full public URL
    const publicURL = data.profile_pic;
    const imagePath = publicURL.split("/storage/v1/object/public/group-profile-pics/")[1];

    if (!imagePath) {
        return res.status(400).json({ error: "Invalid image path" });
    }

    // 3. Delete the image from Supabase storage
    const { error: deleteError } = await supabase.storage
        .from("group-profile-pics")
        .remove([imagePath]);

    if (deleteError) {
        return res.status(500).json({ error: "Failed to delete from storage: " + deleteError.message });
    }

    // 4. Remove the profile_pic URL from the database
    const { error: dbError } = await supabase
        .from("groups")
        .update({ profile_pic: null })
        .eq("id", groupID);

    if (dbError) return res.status(500).json({ error: "Failed to update DB: " + dbError.message });

    res.json({ success: true });
});


module.exports = router;



// update above code with 