import express from "express";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import EventRegistration from "../models/EventRegistration.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import { generateQrCodeDataUrl } from "../utils/qr.js";
import { recalculateClubHealth } from "../services/healthService.js";
import { notifyMany } from "../services/notificationService.js";
import { sendEmail } from "../services/emailService.js";
import { getIo } from "../socket.js";
import { fileToMeta } from "../utils/files.js";
import { createToken } from "../utils/auth.js";
import upload from "../middleware/upload.js";
const router = express.Router();
import fs from "fs";
import path from "path";

// ACCESS CHECK
async function ensureEventAccess(user, event) {
  if (user.role === "admin") return true;

  if (user.role === "faculty") {
    return (user.assignedClubs || []).some(
      (clubId) => String(clubId) === String(event.clubId)
    );
  }

  return false;
}

// GET EVENTS
router.get("/", auth, async (req, res) => {
  try {
    const query = {};

    if (req.user.role === "faculty") {
      query.clubId = { $in: req.user.assignedClubs || [] };
    }

    if (req.user.role === "student") {
      query.status = { $in: ["approved", "postponed"] };
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.clubId) query.clubId = req.query.clubId;
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    const events = await Event.find(query)
      .populate("clubId", "name healthStatus")
      .populate("facultyId", "name email")
      .sort({ date: 1, time: 1 });

    res.json(
      events.map((event) => ({
        ...event.toObject(),
        clubName: event.clubId?.name || "",
        facultyName: event.facultyId?.name || "",
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE EVENT
router.post(
  "/",
  auth,
  permit("admin", "faculty"),
  upload.array("attachments", 10),
  async (req, res) => {
    try {
      let { clubId } = req.body;

      if (req.user.role === "faculty") {
        clubId = req.user.assignedClubs?.[0];
      }

      const club = await Club.findById(clubId);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }

      const qrCodeToken = createToken();

      // ✅ SAFE ADDITION (no existing logic removed)
      let safeFacultyId;

if (req.user.role === "admin") {
  // ✅ always take from club
  if (club.facultyIds && club.facultyIds.length > 0) {
    safeFacultyId = club.facultyIds[0];
  } else {
    // fallback → still avoid crash
    safeFacultyId = req.user._id;
  }
} else {
  safeFacultyId = req.user._id;
}

      // ✅ fallback safety (ONLY addition)
      if (req.user.role === "admin" && !safeFacultyId) {
        if (club.facultyIds && club.facultyIds.length > 0) {
          safeFacultyId = club.facultyIds[0];
        } else {
          return res.status(400).json({
            message: "No faculty assigned to this club",
          });
        }
      }

      const event = await Event.create({
        name: req.body.name,
        description: req.body.description || "",
        clubId,
facultyId: req.user._id,
        date: req.body.date,
        time: req.body.time,
        endTime: req.body.endTime || "",
        location: req.body.location || "",
        maxCapacity: Number(req.body.maxCapacity || 100),
        planned: req.body.planned !== "false",
        budgetRequested: Number(req.body.budgetRequested || 0),
        status: req.user.role === "admin" ? "approved" : "pending",
        qrCodeToken,
        attachments: (req.files || []).map((file) =>
          fileToMeta(file, req.user._id, "faculty")
        ),
      });

      event.qrCodeDataUrl = await generateQrCodeDataUrl(
        JSON.stringify({
          eventId: String(event._id),
          token: qrCodeToken,
        })
      );

      await event.save();

// 🔥 ADD THIS (missing link)
await Club.findByIdAndUpdate(clubId, {
  $inc: { eventCount: 1 },
});

// 🔥 then recalculate
await recalculateClubHealth(clubId);

      getIo().to("student").emit("event:created", event);
      getIo().to(`club:${clubId}`).emit("event:created", event);

      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// UPLOAD FILES
router.post(
  "/:id/upload",
  auth,
  permit("faculty"),
  upload.array("files", 10),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const files = req.files.map((file) =>
        fileToMeta(file, req.user._id, "faculty")
      );

      event.attachments.push(...files);
      await event.save();

      res.json({ message: "Files uploaded", files });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// ADMIN MEDIA
router.get("/admin/media", auth, permit("admin"), async (req, res) => {
  try {
    const events = await Event.find({
      attachments: { $exists: true, $ne: [] },
    })
      .populate("clubId", "name")
      .populate("facultyId", "name")
      .select("name date clubId facultyId attachments");

    // ✅ REMOVE deleted files
    const cleaned = events.map((event) => {
      const obj = event.toObject();

      obj.attachments = obj.attachments.filter(
        (file) => !file.isDeleted
      );

      return obj;
    });

    res.json(cleaned);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE EVENT
router.put("/:id", auth, permit("admin", "faculty"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !(await ensureEventAccess(req.user, event))) {
      return res.status(404).json({ message: "Event not found" });
    }

    const oldStatus = event.status;
    Object.assign(event, req.body);
    await event.save();

    if (oldStatus !== event.status) {
      const registrations = await EventRegistration.find({
        eventId: event._id,
        status: { $ne: "cancelled" },
      }).populate("studentId", "email name");

      const studentIds = registrations.map((r) => r.studentId._id);

      await notifyMany(studentIds, {
        title: "Event status updated",
        message: `${event.name} is now ${event.status}`,
      });
    }

    await recalculateClubHealth(event.clubId);

    getIo().to(`club:${event.clubId}`).emit("event:updated", event);

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE EVENT
router.delete("/:id", auth, permit("admin", "faculty"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.deleteOne();
    await Club.findByIdAndUpdate(event.clubId, {
  $inc: { eventCount: -1 },
});

await recalculateClubHealth(event.clubId);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// APPROVE / REJECT
router.put("/admin/events/:id/status", auth, permit("admin"), async (req, res) => {
  try {
    const { status } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    event.status = status;
    await event.save();

    res.json({ message: "Status updated", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/:eventId/file/:fileId", auth, async (req, res) => {
  try {
    const { eventId, fileId } = req.params;
    const user = req.user;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // permission
    if (user.role !== "admin") {
      if (
        user.role !== "faculty" ||
        String(event.facultyId) !== String(user._id)
      ) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    const file = event.attachments.id(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    // ✅ SOFT DELETE
    file.isDeleted = true;
    file.deletedAt = new Date();
    file.deletedBy = user._id;

    await event.save();

    res.json({ message: "File moved to trash" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

router.get("/admin/trash", auth, permit("admin"), async (req, res) => {
  try {
    const events = await Event.find({
      "attachments.isDeleted": true,
    })
      .populate("clubId", "name")
      .populate("facultyId", "name")
      .select("name date clubId facultyId attachments");

    const trashed = events.map((event) => {
      const obj = event.toObject();

      obj.attachments = obj.attachments.filter(
        (f) => f.isDeleted
      );

      return obj;
    });

    res.json(trashed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:eventId/file/:fileId/restore", auth, permit("admin"), async (req, res) => {
  try {
    const { eventId, fileId } = req.params;

    const event = await Event.findById(eventId);
    const file = event.attachments.id(fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    file.isDeleted = false;
    file.deletedAt = null;
    file.deletedBy = null;

    await event.save();

    res.json({ message: "File restored" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router;