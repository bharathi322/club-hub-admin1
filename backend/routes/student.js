const express = require("express");
const Event = require("../models/Event");
const Club = require("../models/Club");
const EventRegistration = require("../models/EventRegistration");
const Feedback = require("../models/Feedback");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /api/student/events — all approved events
router.get("/events", auth, async (req, res) => {
  try {
    const events = await Event.find({ status: "approved" }).sort({ date: 1 });
    const registrations = await EventRegistration.find({ student: req.user.id });
    const regMap = {};
    registrations.forEach(r => { regMap[r.event.toString()] = r.status; });
    const enriched = events.map(e => ({
      ...e.toObject(),
      registrationStatus: regMap[e._id.toString()] || null,
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/student/events/:id/register
router.post("/events/:id/register", auth, async (req, res) => {
  try {
    const existing = await EventRegistration.findOne({ event: req.params.id, student: req.user.id });
    if (existing) return res.status(400).json({ message: "Already registered" });
    const reg = await EventRegistration.create({ event: req.params.id, student: req.user.id });
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
      return res.json(existing);
    }
    const feedback = await Feedback.create({ student: req.user.id, targetType, targetId, rating, comment });
    res.status(201).json(feedback);
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

// GET /api/student/my-feedback — all feedback given by student
router.get("/my-feedback", auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ student: req.user.id }).sort({ createdAt: -1 });
    // Populate target names
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
