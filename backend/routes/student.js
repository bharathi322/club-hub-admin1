import express from "express";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import EventRegistration from "../models/EventRegistration.js";
import Feedback from "../models/Feedback.js";
import Attendance from "../models/Attendance.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import { createConfirmationCode } from "../utils/auth.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";

const router = express.Router();
router.use(auth, permit("student"));

router.get("/events", async (req, res) => {
  try {
    const events = await Event.find({ status: { $in: ["approved", "postponed"] } })
      .populate("clubId", "name")
      .sort({ date: 1, time: 1 });

    const registrations = await EventRegistration.find({
      studentId: req.user._id,
      status: { $ne: "cancelled" },
    });

    const regMap = Object.fromEntries(
      registrations.map((registration) => [String(registration.eventId), registration])
    );

    res.json(
      events.map((event) => ({
        ...event.toObject(),
        clubName: event.clubId?.name || "",
        registrationStatus: regMap[String(event._id)]?.status || null,
        confirmationCode: regMap[String(event._id)]?.confirmationCode || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/events/:id/register", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("clubId", "name");
    if (!event || !["approved", "postponed"].includes(event.status)) {
      return res.status(404).json({ message: "Event not available for registration" });
    }

    if (event.registeredCount >= event.maxCapacity) {
      return res.status(400).json({ message: "No seats remaining" });
    }

    const existing = await EventRegistration.findOne({
      eventId: event._id,
      studentId: req.user._id,
    });
    if (existing && existing.status !== "cancelled") {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    const registration = existing
      ? await EventRegistration.findByIdAndUpdate(
          existing._id,
          {
            status: "registered",
            cancelledAt: null,
            confirmationCode: createConfirmationCode(),
          },
          { new: true }
        )
      : await EventRegistration.create({
          eventId: event._id,
          studentId: req.user._id,
          confirmationCode: createConfirmationCode(),
        });

    event.registeredCount += existing?.status === "cancelled" ? 1 : 1;
    await event.save();

    await sendEmail({
      to: req.user.email,
      subject: `Registration confirmed for ${event.name}`,
      template: "event-registration-confirmed",
      html: `<p>Confirmation number: <strong>${registration.confirmationCode}</strong></p><p>${event.name} on ${event.date} at ${event.time}, ${event.location}.</p>`,
      text: `Registered for ${event.name}. Confirmation number: ${registration.confirmationCode}.`,
      metadata: { eventId: String(event._id), studentId: String(req.user._id) },
    });

    await createNotification({
      userId: req.user._id,
      title: "Event registered",
      message: `${event.name} registration confirmed`,
      type: "success",
      metadata: { eventId: String(event._id) },
    });

    res.status(201).json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/events/:id/register", async (req, res) => {
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
      event.registeredCount = Math.max(event.registeredCount - 1, 0);
      await event.save();
      await sendEmail({
        to: req.user.email,
        subject: `Registration cancelled for ${event.name}`,
        template: "event-registration-cancelled",
        html: `<p>Your registration for ${event.name} has been cancelled.</p>`,
        text: `Your registration for ${event.name} has been cancelled.`,
        metadata: { eventId: String(event._id), studentId: String(req.user._id) },
      });
    }

    res.json({ message: "Registration cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/clubs", async (_req, res) => {
  try {
    const clubs = await Club.find().sort({ name: 1 });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my-registrations", async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ studentId: req.user._id })
      .populate({
        path: "eventId",
        populate: { path: "clubId", select: "name" },
      })
      .sort({ createdAt: -1 });

    const attendance = await Attendance.find({ studentId: req.user._id });
    const attendanceMap = Object.fromEntries(attendance.map((item) => [String(item.eventId), item]));

    res.json(
      registrations.map((registration) => ({
        ...registration.toObject(),
        event: registration.eventId,
        attendance: attendanceMap[String(registration.eventId?._id)] || null,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my-feedback", async (req, res) => {
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

router.post("/feedback", async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      eventId: req.body.eventId,
      studentId: req.user._id,
    });
    if (!attendance) {
      return res.status(403).json({ message: "Feedback is allowed only after attendance is marked" });
    }

    const event = await Event.findById(req.body.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const feedback = await Feedback.findOneAndUpdate(
      { studentId: req.user._id, eventId: event._id },
      {
        studentId: req.user._id,
        eventId: event._id,
        clubId: event.clubId,
        rating: req.body.rating,
        comment: req.body.comment || "",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
