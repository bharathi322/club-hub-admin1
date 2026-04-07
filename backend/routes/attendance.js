const express = require("express");
const crypto = require("crypto");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { emitToUser, emitToRole } = require("../helpers/socketManager");
const router = express.Router();

// POST /api/attendance/generate-qr/:eventId — Generate QR code token for event
router.post("/generate-qr/:eventId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Verify faculty owns this event
    const user = await User.findById(req.user.id).populate("assignedClub");
    if (user.role === "faculty" && user.assignedClub?.name !== event.club) {
      return res.status(403).json({ message: "Not your club's event" });
    }

    // Generate unique QR token
    const qrToken = crypto.randomBytes(32).toString("hex");
    event.qrCode = qrToken;
    await event.save();

    res.json({ qrToken, eventId: event._id, eventName: event.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/attendance/scan — Student scans QR code
router.post("/scan", auth, async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ message: "QR token required" });

    const event = await Event.findOne({ qrCode: qrToken });
    if (!event) return res.status(404).json({ message: "Invalid QR code" });

    // Check if student is registered
    const reg = await EventRegistration.findOne({
      event: event._id,
      student: req.user.id,
    });

    if (!reg) return res.status(400).json({ message: "You are not registered for this event" });
    if (reg.status === "attended") return res.status(400).json({ message: "Already checked in" });

    // Check time window (allow check-in from 1 hour before to 3 hours after event time)
    // Simple check: just verify the date matches
    const today = new Date().toISOString().split("T")[0];
    if (event.date !== today) {
      return res.status(400).json({ message: "Check-in is only available on the event day" });
    }

    // Mark as attended
    reg.status = "attended";
    await reg.save();

    const student = await User.findById(req.user.id).select("name email");

    // Real-time update to faculty
    emitToRole("faculty", "attendance-update", {
      eventId: event._id.toString(),
      eventName: event.name,
      student: { _id: req.user.id, name: student.name, email: student.email },
      status: "attended",
      timestamp: new Date(),
    });

    // Real-time update to admin
    emitToRole("admin", "attendance-update", {
      eventId: event._id.toString(),
      eventName: event.name,
      studentName: student.name,
    });

    res.json({
      message: "Check-in successful!",
      event: { _id: event._id, name: event.name, club: event.club },
      status: "attended",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/attendance/:eventId/live — Get live attendance for event
router.get("/:eventId/live", auth, async (req, res) => {
  try {
    const regs = await EventRegistration.find({ event: req.params.eventId })
      .populate("student", "name email");

    const total = regs.length;
    const attended = regs.filter((r) => r.status === "attended").length;

    res.json({
      total,
      attended,
      attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      registrations: regs.map((r) => ({
        _id: r._id,
        student: r.student,
        status: r.status,
        updatedAt: r.updatedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
