const express = require("express");
const User = require("../models/User");
const Club = require("../models/Club");
const Event = require("../models/Event");
const auth = require("../middleware/auth");
const crypto = require("crypto");
const { sendEmail, facultyCredentialsEmail } = require("../helpers/emailService");
const { notifyProofReviewed, notifyBudgetAllocated } = require("../helpers/notifications");
const { recalculateClubHealth, recalculateAllClubs } = require("../helpers/clubHealth");
const router = express.Router();

// GET /api/admin/faculty — list all faculty users with their assigned club
router.get("/faculty", auth, async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .select("_id name email assignedClub mustChangePassword")
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

// POST /api/admin/faculty — create a new faculty account + email credentials
router.post("/faculty", auth, async (req, res) => {
  try {
    const { name, email, clubId } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // Auto-generate password
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: "faculty",
      assignedClub: clubId || null,
      mustChangePassword: true,
    });

    // Get club name for email
    let clubName = "Unassigned";
    if (clubId) {
      const club = await Club.findById(clubId);
      if (club) clubName = club.name;
    }

    // Send credentials email
    const emailData = facultyCredentialsEmail(name, email, tempPassword, clubName);
    await sendEmail(emailData);

    const populated = await User.findById(user._id)
      .select("_id name email assignedClub mustChangePassword")
      .populate("assignedClub", "name");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/clubs/:id/events — get all events for a specific club with documents/photos
router.get("/clubs/:id/events", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found" });
    const events = await Event.find({ club: club.name }).sort({ date: -1 });
    res.json({ club, events });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/clubs/:id/budget — allocate budget to a club
router.put("/clubs/:id/budget", auth, async (req, res) => {
  try {
    const { budgetAllocated } = req.body;
    const club = await Club.findByIdAndUpdate(
      req.params.id,
      { budgetAllocated: Number(budgetAllocated) },
      { new: true }
    );
    if (!club) return res.status(404).json({ message: "Club not found" });

    // Notify assigned faculty
    const faculty = await User.find({ assignedClub: club._id, role: "faculty" });
    for (const f of faculty) {
      await notifyBudgetAllocated(f, club, Number(budgetAllocated));
    }

    res.json(club);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/events/:id/review-proof — approve/reject event proofs
router.put("/events/:id/review-proof", auth, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.proofStatus = status;
    event.proofRemarks = remarks || "";
    await event.save();

    // Find the faculty for this club and notify them
    const club = await Club.findOne({ name: event.club });
    if (club) {
      const faculty = await User.find({ assignedClub: club._id, role: "faculty" });
      for (const f of faculty) {
        await notifyProofReviewed(f, event, status, remarks);
      }
      // Recalculate club health after proof review
      await recalculateClubHealth(club._id);
    }

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/recalculate-health — manually trigger health recalculation
router.post("/recalculate-health", auth, async (req, res) => {
  try {
    const results = await recalculateAllClubs();
    res.json({ message: "Health recalculated", results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/budget-overview — budget overview per club with faculty info
router.get("/budget-overview", auth, async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    const overview = [];

    for (const club of clubs) {
      const faculty = await User.findOne({ assignedClub: club._id, role: "faculty" }).select("name email");
      const events = await Event.find({ club: club.name });
      const totalUsed = events.reduce((sum, e) => sum + (e.budgetUsed || 0), 0);

      overview.push({
        club: { _id: club._id, name: club.name },
        faculty: faculty ? { name: faculty.name, email: faculty.email } : null,
        budgetAllocated: club.budgetAllocated || 0,
        budgetUsed: totalUsed,
        eventCount: events.length,
      });
    }

    res.json(overview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
