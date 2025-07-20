// backend/routes/profile.js
const express = require("express");
const multer = require("multer");
const  supabase  = require("../config/supabaseClient");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");


// Multer setup to handle image file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Update full name of user
router.post("/update-fullname", async (req, res) => {
  const { username, fullName } = req.body;

  if (!username || !fullName) {
    return res.status(400).json({ error: "Username and full name are required" });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ name: fullName })
    .eq("username", username)
    .select("name") // return only the updated name
    .single(); // get a single object, not array

  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true, fullName: data.name });
});




// Get profile picture for a user
router.get("/get-profile-pic/:username", async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
    
  }

  const { data, error } = await supabase
    .from("users")
    .select("profile_pic")
    .eq("username", username)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (!data?.profile_pic) {
    return res.status(404).json({ error: "Profile picture not found" });
  }

  res.json({ profilePicUrl: data.profile_pic });
});


router.post("/upload-profile-pic", upload.single("file"), async (req, res) => {
  const { username } = req.body;
  const file = req.file;

  // console.log('File is ',file);
  

  if (!username || !file) {
    return res.status(400).json({ error: "Username and file are required" });
  }

  // 1. Fetch current profile_pic URL from DB
  const { data: userData, error: fetchError } = await supabase
    .from("users")
    .select("profile_pic")
    .eq("username", username)
    .single();
    

  if (fetchError) {
    console.error("Failed to fetch existing image:", fetchError.message);
  }

  // 2. Delete old image from Supabase if exists
  if (userData?.profile_pic) {
    console.log('the path of the log is ', userData.profile_pic);
    
    const oldImagePath = userData.profile_pic.split(
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
    .from("profile-pics")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false, // don't overwrite if file with same name exists
    });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const publicURL = `${process.env.SUPABASE_URL}/storage/v1/object/public/profile-pics/${fileName}`;

  // 4. Update new URL in DB
  const { error: dbError } = await supabase
    .from("users")
    .update({ profile_pic: publicURL })
    .eq("username", username);

  if (dbError) return res.status(500).json({ error: dbError.message });

  res.json({ success: true, profilePicUrl: publicURL });
});

router.get("/get-users-fullName/:username", async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ error: "Username is required in URL params." });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("name")
      .eq("username", username)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error.message);
      return res.status(500).json({ error: "Failed to fetch user full name." });
    }

    res.status(200).json({ fullName: data.name });
  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
});


// Delete Profile Picture (fetch path from DB using username)
router.post("/delete-profile-pic", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // 1. Get the user's current profile picture URL
  const { data, error: fetchError } = await supabase
    .from("users")
    .select("profile_pic")
    .eq("username", username)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  if (!data?.profile_pic) {
    return res.status(404).json({ error: "No profile picture found for user" });
  }

  // 2. Extract the image path from the full public URL
  const publicURL = data.profile_pic;
  const imagePath = publicURL.split("/storage/v1/object/public/profile-pics/")[1];

  if (!imagePath) {
    return res.status(400).json({ error: "Invalid image path" });
  }

  // 3. Delete the image from Supabase storage
  const { error: deleteError } = await supabase.storage
    .from("profile-pics")
    .remove([imagePath]);

  if (deleteError) {
    return res.status(500).json({ error: "Failed to delete from storage: " + deleteError.message });
  }

  // 4. Remove the profile_pic URL from the database
  const { error: dbError } = await supabase
    .from("users")
    .update({ profile_pic: null })
    .eq("username", username);

  if (dbError) return res.status(500).json({ error: "Failed to update DB: " + dbError.message });

  res.json({ success: true });
});


module.exports = router;



// update above code with 