import express from "express";
import auth from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import User from "../models/User.js";

const router = express.Router();

// UPDATE PROFILE
router.put("/profile", auth, upload.single("image"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.json({
      user,
      message: "Profile updated",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;