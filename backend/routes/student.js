import express from "express";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import EventRegistration from "../models/EventRegistration.js";
import Feedback from "../models/Feedback.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET EVENTS
router.get("/events", auth, async (req, res) => {
  try {
    const events = await Event.find({ status: "approved" }).sort({ date: 1 });

    const registrations = await EventRegistration.find({ studentId: req.user._id });
    const regMap = {};

    registrations.forEach((r) => {
      regMap[r.eventId?.toString()] = r.status;
    });

    const enriched = events.map((e) => ({
      ...e.toObject(),
      registrationStatus: regMap[e._id.toString()] || null,
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// REGISTER EVENT
router.post("/events/:id/register", auth, async (req, res) => {
  try {
    const existing = await EventRegistration.findOne({
      eventId: req.params.id,
      studentId: req.user._id,
    });

    if (existing) return res.status(400).json({ message: "Already registered" });

    const reg = await EventRegistration.create({
      eventId: req.params.id,
      studentId: req.user._id,
    });

    res.status(201).json(reg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CANCEL REGISTRATION
router.delete("/events/:id/register", auth, async (req, res) => {
  try {
    const registration = await EventRegistration.findOne({
      eventId: req.params.id,
      studentId: req.user._id,
      status: { $ne: "cancelled" },
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.status = "cancelled";
    registration.cancelledAt = new Date();
    await registration.save();

    const event = await Event.findById(req.params.id);
    if (event) {
      event.registeredCount = Math.max((event.registeredCount || 1) - 1, 0);
      await event.save();
    }

    res.json({ message: "Registration cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET CLUBS
router.get("/clubs", async (_req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MY REGISTRATIONS
router.get("/my-registrations", auth, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ studentId: req.user._id })
      .populate("eventId", "name date")
      .sort({ createdAt: -1 });

    res.json(regs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SUBMIT FEEDBACK
router.post("/feedback", auth, async (req, res) => {
  try {
    const { targetType, targetId, rating, comment } = req.body;

    let existing = await Feedback.findOne({
      studentId: req.user._id,
      targetType,
      targetId,
    });

    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      await existing.save();
      return res.json(existing);
    }

    const feedback = await Feedback.create({
      studentId: req.user._id,
      targetType,
      targetId,
      rating,
      comment,
    });

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET MY FEEDBACK
router.get("/my-feedback", auth, async (req, res) => {
  try {
    const feedback = await Feedback.find({ studentId: req.user._id })
      .populate("eventId", "name")
      .populate("clubId", "name")
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;