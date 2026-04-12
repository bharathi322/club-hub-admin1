import express from "express";
import Club from "../models/Club.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Feedback from "../models/Feedback.js";
import Attendance from "../models/Attendance.js";
import BudgetRequest from "../models/Budget.js";
import ProofSubmission from "../models/ProofSubmission.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import checkFacultyClub from "../middleware/checkFacultyClub.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { recalculateClubHealth } from "../services/healthService.js";

const router = express.Router();
router.use(auth, permit("faculty"), checkFacultyClub);

router.get("/my-club", async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClubIds[0]).populate("facultyIds", "name email");
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/events", async (req, res) => {
  try {
    const events = await Event.find({ clubId: { $in: req.assignedClubIds } })
      .populate("clubId", "name")
      .sort({ date: -1, time: -1 });
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

router.get("/registrations", async (req, res) => {
  try {
    const events = await Event.find({ clubId: { $in: req.assignedClubIds } }).select("_id name");
    const eventIds = events.map((event) => event._id);
    const registrations = await EventRegistration.find({ eventId: { $in: eventIds } })
      .populate("studentId", "name email studentId")
      .populate("eventId", "name date time location")
      .sort({ createdAt: -1 });
    res.json(
      registrations.map((registration) => ({
        ...registration.toObject(),
        student: registration.studentId,
        event: registration.eventId,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/registrations/:id/attend", async (req, res) => {
  try {
    const registration = await EventRegistration.findById(req.params.id).populate("eventId");
    if (!registration || !req.assignedClubIds.includes(String(registration.eventId.clubId))) {
      return res.status(404).json({ message: "Registration not found" });
    }

    registration.status = req.body.status === "attended" ? "attended" : "registered";
    await registration.save();

    if (req.body.status === "attended") {
      await Attendance.findOneAndUpdate(
        { eventId: registration.eventId._id, studentId: registration.studentId },
        {
          eventId: registration.eventId._id,
          studentId: registration.studentId,
          registrationId: registration._id,
          checkInTime: new Date(),
          status: "present",
          markedBy: "manual",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const event = await Event.findById(registration.eventId._id);
    event.attendanceCount = await Attendance.countDocuments({ eventId: event._id });
    event.attendanceRate = event.registeredCount
      ? Number(((event.attendanceCount / event.registeredCount) * 100).toFixed(1))
      : 0;
    await event.save();
    await recalculateClubHealth(event.clubId);

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/attendance/bulk", async (req, res) => {
  try {
    const ids = req.body.ids || [];
    let count = 0;
    for (const id of ids) {
      const registration = await EventRegistration.findById(id).populate("eventId");
      if (!registration || !req.assignedClubIds.includes(String(registration.eventId.clubId))) {
        continue;
      }

      registration.status = "attended";
      await registration.save();
      await Attendance.findOneAndUpdate(
        { eventId: registration.eventId._id, studentId: registration.studentId },
        {
          eventId: registration.eventId._id,
          studentId: registration.studentId,
          registrationId: registration._id,
          checkInTime: new Date(),
          status: "present",
          markedBy: "manual",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      count += 1;
    }

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const club = await Club.findById(_req.assignedClubIds[0]);
    const events = await Event.find({ clubId: { $in: _req.assignedClubIds } });
    const eventIds = events.map((event) => event._id);
    const totalRegistrations = await EventRegistration.countDocuments({ eventId: { $in: eventIds } });
    const feedbackCount = await Feedback.countDocuments({ clubId: { $in: _req.assignedClubIds } });

    res.json({
      totalEvents: events.length,
      pendingEvents: events.filter((event) => event.status === "pending").length,
      totalRegistrations,
      feedbackCount,
      clubRating: club?.rating || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/feedback", async (_req, res) => {
  try {
    const feedback = await Feedback.find({ clubId: { $in: _req.assignedClubIds } })
      .populate("studentId", "name email")
      .populate("eventId", "name date")
      .sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/budget-request", async (req, res) => {
  try {
    const request = await BudgetRequest.create({
      clubId: req.body.clubId || req.assignedClubIds[0],
      eventId: req.body.eventId || null,
      facultyId: req.user._id,
      amount: req.body.amount,
      purpose: req.body.purpose,
    });

    await createNotification({
      userId: req.user._id,
      title: "Budget request submitted",
      message: `INR ${request.amount} requested`,
      type: "success",
      metadata: { requestId: String(request._id) },
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/proofs", async (_req, res) => {
  try {
    const proofs = await ProofSubmission.find({ clubId: { $in: _req.assignedClubIds } })
      .populate("eventId", "name date proofStatus")
      .sort({ updatedAt: -1 });
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/feedback/respond", async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.body.feedbackId).populate("studentId", "email name");
    if (!feedback || !req.assignedClubIds.includes(String(feedback.clubId))) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.facultyResponse = req.body.response;
    feedback.facultyRespondedAt = new Date();
    await feedback.save();

    await sendEmail({
      to: feedback.studentId.email,
      subject: "Faculty responded to your feedback",
      template: "feedback-response",
      html: `<p>${req.body.response}</p>`,
      text: req.body.response,
      metadata: { feedbackId: String(feedback._id), studentId: String(feedback.studentId._id) },
    });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
