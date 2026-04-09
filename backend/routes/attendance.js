import express from "express";
import crypto from "crypto";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { emitToUser, emitToRole } from "../socketManager.js";
const router = express.Router();

// Generate QR
router.post("/generate-qr/:eventId", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const user = await User.findById(req.user.id).populate("assignedClub");

    if (user.role === "faculty" && user.assignedClub?.name !== event.club) {
      return res.status(403).json({ message: "Not your club's event" });
    }

    const qrToken = crypto.randomBytes(32).toString("hex");
    event.qrCode = qrToken;
    await event.save();

    res.json({ qrToken, eventId: event._id, eventName: event.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Scan QR
router.post("/scan", auth, async (req, res) => {
  try {
    const { qrToken } = req.body;
    if (!qrToken) return res.status(400).json({ message: "QR token required" });

    const event = await Event.findOne({ qrCode: qrToken });
    if (!event) return res.status(404).json({ message: "Invalid QR code" });

    const reg = await EventRegistration.findOne({
      event: event._id,
      student: req.user.id,
    });

    if (!reg) {
      return res.status(400).json({ message: "Not registered for this event" });
    }

    if (reg.status === "attended") {
      return res.status(400).json({ message: "Already checked in" });
    }

    const today = new Date().toISOString().split("T")[0];
    if (event.date !== today) {
      return res.status(400).json({ message: "Check-in only on event day" });
    }

    reg.status = "attended";
    await reg.save();

    const student = await User.findById(req.user.id).select("name email");

    emitToRole("faculty", "attendance-update", {
      eventId: event._id.toString(),
      eventName: event.name,
      student: {
        _id: req.user.id,
        name: student.name,
        email: student.email,
      },
      status: "attended",
      timestamp: new Date(),
    });

    emitToRole("admin", "attendance-update", {
      eventId: event._id.toString(),
      eventName: event.name,
      studentName: student.name,
    });

    res.json({
      message: "Check-in successful",
      event: { _id: event._id, name: event.name, club: event.club },
      status: "attended",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Live attendance
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

export default router;