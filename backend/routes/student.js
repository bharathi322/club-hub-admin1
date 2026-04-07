const express = require("express");
const Event = require("../models/Event");
const Club = require("../models/Club");
const EventRegistration = require("../models/EventRegistration");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { notifyEventRegistration } = require("../helpers/notifications");
const { recalculateClubHealth } = require("../helpers/clubHealth");
const router = express.Router();

// GET /api/student/events — all approved events with seat info
router.get("/events", auth, async (req, res) => {
  try {
    const events = await Event.find({ status: "approved" }).sort({ date: 1 });
    const registrations = await EventRegistration.find({ student: req.user.id });
    const regMap = {};
    registrations.forEach(r => { regMap[r.event.toString()] = r.status; });

    const enriched = [];
    for (const e of events) {
      const regCount = await EventRegistration.countDocuments({ event: e._id });
      enriched.push({
        ...e.toObject(),
        registrationStatus: regMap[e._id.toString()] || null,
        registeredCount: regCount,
        seatsRemaining: e.maxSeats > 0 ? Math.max(0, e.maxSeats - regCount) : null,
      });
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/student/events/:id/register
router.post("/events/:id/register", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check seat limit
    if (event.maxSeats > 0) {
      const currentRegs = await EventRegistration.countDocuments({ event: event._id });
      if (currentRegs >= event.maxSeats) {
        return res.status(400).json({ message: "No seats available" });
      }
    }

    const existing = await EventRegistration.findOne({ event: req.params.id, student: req.user.id });
    if (existing) return res.status(400).json({ message: "Already registered" });

    const reg = await EventRegistration.create({ event: req.params.id, student: req.user.id });

    // Send email + notify faculty
    const student = await User.findById(req.user.id).select("name email");
    await notifyEventRegistration(student, event);

    res.status(201).json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/student/events/:id/register — cancel registration
router.delete("/events/:id/register", auth, async (req, res) => {
  try {
    await EventRegistration.findOneAndDelete({ event: req.params.id, student: req.user.id });
    res.json({ message: "Registration cancelled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/clubs
router.get("/clubs", auth, async (req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/student/feedback
router.post("/feedback", auth, async (req, res) => {
  try {
    const { targetType, targetId, rating, comment } = req.body;
    const existing = await Feedback.findOne({ student: req.user.id, targetType, targetId });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      await existing.save();

      // Recalculate club health
      if (targetType === "club") await recalculateClubHealth(targetId);
      else {
        const event = await Event.findById(targetId);
        if (event) {
          const club = await Club.findOne({ name: event.club });
          if (club) await recalculateClubHealth(club._id);
        }
      }

      return res.json(existing);
    }
    const feedback = await Feedback.create({ student: req.user.id, targetType, targetId, rating, comment });

    // Recalculate club health
    if (targetType === "club") await recalculateClubHealth(targetId);
    else {
      const event = await Event.findById(targetId);
      if (event) {
        const club = await Club.findOne({ name: event.club });
        if (club) await recalculateClubHealth(club._id);
      }
    }

    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/student/events/:id/upload-photos — student uploads event photos
router.post("/events/:id/upload-photos", auth, (req, res, next) => {
  req.uploadSubDir = "student-uploads";
  next();
}, upload.array("photos", 5), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Verify student attended
    const reg = await EventRegistration.findOne({ event: event._id, student: req.user.id });
    if (!reg || reg.status !== "attended") {
      return res.status(403).json({ message: "Only attended students can upload" });
    }

    const filePaths = req.files.map(f => `/uploads/student-uploads/${f.filename}`);
    event.photos = [...(event.photos || []), ...filePaths];
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/my-registrations
router.get("/my-registrations", auth, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ student: req.user.id }).populate("event");
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/student/my-feedback
router.get("/my-feedback", auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ student: req.user.id }).sort({ createdAt: -1 });
    const enriched = [];
    for (const fb of feedback) {
      const obj = fb.toObject();
      if (fb.targetType === "club") {
        const club = await Club.findById(fb.targetId).select("name");
        obj.targetName = club?.name || "Unknown Club";
      } else {
        const event = await Event.findById(fb.targetId).select("name");
        obj.targetName = event?.name || "Unknown Event";
      }
      enriched.push(obj);
    }
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
