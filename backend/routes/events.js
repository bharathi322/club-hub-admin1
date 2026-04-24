import express from "express";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import EventRegistration from "../models/EventRegistration.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import { upload } from "../middleware/upload.js";
import { generateQrCodeDataUrl } from "../utils/qr.js";
import { recalculateClubHealth } from "../services/healthService.js";
import { notifyMany } from "../services/notificationService.js";
import { sendEmail } from "../services/emailService.js";
import { getIo } from "../socket.js";
import { fileToMeta } from "../utils/files.js";
import { createToken } from "../utils/auth.js";

const router = express.Router();

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

      const event = await Event.create({
        name: req.body.name,
        description: req.body.description || "",
        clubId,
        facultyId:
          req.user.role === "admin"
            ? req.body.facultyId || club.facultyIds?.[0]
            : req.user._id,
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

      // QR CODE
      event.qrCodeDataUrl = await generateQrCodeDataUrl(
        JSON.stringify({
          eventId: String(event._id),
          token: qrCodeToken,
        })
      );

      await event.save();
      await recalculateClubHealth(clubId);

      getIo().to("student").emit("event:created", event);
      getIo().to(`club:${clubId}`).emit("event:created", event);

      res.status(201).json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;