const express = require("express");
const User = require("../models/User");
const Club = require("../models/Club");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /api/admin/faculty — list all faculty users with their assigned club
router.get("/faculty", auth, async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .select("_id name email assignedClub")
      .populate("assignedClub", "name")
      .sort({ name: 1 });
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/faculty/:id/assign — assign a club to faculty
router.put("/faculty/:id/assign", auth, async (req, res) => {
  try {
    const { clubId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "faculty") return res.status(404).json({ message: "Faculty not found" });
    user.assignedClub = clubId || null;
    await user.save();
    const updated = await User.findById(user._id).select("_id name email assignedClub").populate("assignedClub", "name");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
