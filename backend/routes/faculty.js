const express = require("express");
const Event = require("../models/Event");
const Club = require("../models/Club");
const User = require("../models/User");
const EventRegistration = require("../models/EventRegistration");
const Feedback = require("../models/Feedback");
const Complaint = require("../models/Complaint");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const { notifyNewEvent, notifyEventStatusChange, notifyProofSubmitted, checkBudgetThreshold } = require("../helpers/notifications");
const { recalculateClubHealth } = require("../helpers/clubHealth");
const router = express.Router();

// Middleware: ensure faculty & get assigned club
const facultyOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "faculty") return res.status(403).json({ message: "Faculty only" });
    if (!user.assignedClub) return res.status(403).json({ message: "No club assigned" });
    req.assignedClub = user.assignedClub;
    req.facultyUser = user;
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

// PUT /api/faculty/my-club
router.put("/my-club", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.assignedClub, req.body, { new: true });
    res.json(club);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/events
router.get("/events", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const events = await Event.find({ club: club.name }).sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/events — create event
router.post("/events", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.create({ ...req.body, club: club.name });
    notifyNewEvent(event);
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

// POST /api/faculty/events/:id/upload-photos
router.post("/events/:id/upload-photos", auth, facultyOnly, (req, res, next) => {
  req.uploadSubDir = "photos";
  next();
}, upload.array("photos", 10), async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    const filePaths = req.files.map(f => `/uploads/photos/${f.filename}`);
    event.photos = [...(event.photos || []), ...filePaths];
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/events/:id/upload-documents
router.post("/events/:id/upload-documents", auth, facultyOnly, (req, res, next) => {
  req.uploadSubDir = "documents";
  next();
}, upload.array("documents", 10), async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    const filePaths = req.files.map(f => `/uploads/documents/${f.filename}`);
    event.documents = [...(event.documents || []), ...filePaths];
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/events/:id/upload-budget-proof
router.post("/events/:id/upload-budget-proof", auth, facultyOnly, (req, res, next) => {
  req.uploadSubDir = "budget-proofs";
  next();
}, upload.array("budgetProof", 5), async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    const filePaths = req.files.map(f => `/uploads/budget-proofs/${f.filename}`);
    event.budgetProof = [...(event.budgetProof || []), ...filePaths];
    if (req.body.budgetUsed !== undefined) {
      event.budgetUsed = Number(req.body.budgetUsed);
    }
    await event.save();

    // Check budget thresholds
    const events = await Event.find({ club: club.name });
    const totalUsed = events.reduce((sum, e) => sum + (e.budgetUsed || 0), 0);
    await checkBudgetThreshold(club, totalUsed);

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/faculty/events/:id/budget
router.put("/events/:id/budget", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });
    if (req.body.budgetUsed !== undefined) event.budgetUsed = Number(req.body.budgetUsed);
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculty/events/:id/submit-proof — submit all proofs for admin review
router.post("/events/:id/submit-proof", auth, facultyOnly, async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClub);
    const event = await Event.findById(req.params.id);
    if (!event || event.club !== club.name) return res.status(403).json({ message: "Not your club's event" });

    event.proofStatus = "submitted";
    await event.save();

    // Notify admin
    const faculty = await User.findById(req.user.id);
    await notifyProofSubmitted(faculty, club, event);

    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/registrations
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

// PATCH /api/faculty/registrations/:id/attend
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

// PATCH /api/faculty/registrations/bulk-attend
router.patch("/registrations/bulk-attend", auth, facultyOnly, async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: "No IDs provided" });
    const club = await Club.findById(req.assignedClub);
    const events = await Event.find({ club: club.name });
    const eventIds = events.map(e => e._id.toString());
    const regs = await EventRegistration.find({ _id: { $in: ids } }).populate("event");
    const valid = regs.filter(r => eventIds.includes(r.event._id.toString()));
    if (!valid.length) return res.status(403).json({ message: "No valid registrations" });
    const validIds = valid.map(r => r._id);
    const newStatus = status === "registered" ? "registered" : "attended";
    await EventRegistration.updateMany({ _id: { $in: validIds } }, { status: newStatus });
    res.json({ message: `${validIds.length} registrations updated`, count: validIds.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/faculty/feedback
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

// GET /api/faculty/stats
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
    const totalBudgetUsed = events.reduce((sum, e) => sum + (e.budgetUsed || 0), 0);
    res.json({
      totalEvents: events.length,
      pendingEvents,
      totalRegistrations,
      feedbackCount,
      clubRating: club.rating,
      totalBudgetUsed,
      budgetAllocated: club.budgetAllocated || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
