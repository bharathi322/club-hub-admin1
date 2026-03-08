const express = require("express");
const Event = require("../models/Event");
const Club = require("../models/Club");
const User = require("../models/User");
const EventRegistration = require("../models/EventRegistration");
const Feedback = require("../models/Feedback");
const Complaint = require("../models/Complaint");
const auth = require("../middleware/auth");
const { notifyNewEvent, notifyEventStatusChange } = require("../helpers/notifications");
const router = express.Router();

// Middleware: ensure faculty & get assigned club
const facultyOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "faculty") return res.status(403).json({ message: "Faculty only" });
    if (!user.assignedClub) return res.status(403).json({ message: "No club assigned" });
    req.assignedClub = user.assignedClub;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/faculty/my-club
router.get("/my-club", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.json(club);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/faculty/my-club — update club details
router.put("/my-club", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.assignedClub, req.body, { new: true });
    res.json(club);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/events — events for assigned club
router.get("/events", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const events = await Event.find({ club: club.name }).sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/events — create event for assigned club
router.post("/events", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.create({ ...req.body, club: club.name });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/faculty/events/:id
router.put("/events/:id", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/faculty/events/:id
router.delete("/events/:id", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/registrations — students registered for club events
router.get("/registrations", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const events = await Event.find({ club: club.name });
    const eventIds = events.map(e => e._id);
    const regs = await EventRegistration.find({ event: { $in: eventIds } })
      .populate("event")
      .populate("student", "name email");
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/faculty/registrations/:id/attend — mark a registration as attended
router.patch("/registrations/:id/attend", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const reg = await EventRegistration.findById(req.params.id).populate("event");
    if (!reg) return res.status(404).json({ message: "Registration not found" });
    if (reg.event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    reg.status = req.body.status === "registered" ? "registered" : "attended";
    await reg.save();
    await reg.populate("student", "name email");
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/feedback — feedback for the club and its events
router.get("/feedback", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const events = await Event.find({ club: club.name });
    const eventIds = events.map(e => e._id);
    const clubFeedback = await Feedback.find({ targetType: "club", targetId: req.assignedClub }).populate("student", "name");
    const eventFeedback = await Feedback.find({ targetType: "event", targetId: { $in: eventIds } }).populate("student", "name");
    res.json({ clubFeedback, eventFeedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/stats — quick stats for the club
router.get("/stats", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const events = await Event.find({ club: club.name });
    const eventIds = events.map(e => e._id);
    const totalRegistrations = await EventRegistration.countDocuments({ event: { $in: eventIds } });
    const pendingEvents = events.filter(e => e.status === "pending").length;
    const feedbackCount = await Feedback.countDocuments({
      $or: [
        { targetType: "club", targetId: req.assignedClub },
        { targetType: "event", targetId: { $in: eventIds } },
      ],
    });
    res.json({
      totalEvents: events.length,
      pendingEvents,
      totalRegistrations,
      feedbackCount,
      clubRating: club.rating,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
