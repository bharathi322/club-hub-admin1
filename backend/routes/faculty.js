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

// GET MY CLUB
router.get("/my-club", async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClubIds[0]).populate("facultyIds", "name email");
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET EVENTS
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find({ clubId: { $in: req.assignedClubIds } })
      .populate("clubId", "name")
      .sort({ date: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET REGISTRATIONS
router.get("/registrations", async (req, res) => {
  try {
    const events = await Event.find({ clubId: { $in: req.assignedClubIds } });
    const eventIds = events.map((e) => e._id);

    const registrations = await EventRegistration.find({ eventId: { $in: eventIds } })
      .populate("studentId", "name email")
      .populate("eventId", "name date");

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// MARK ATTENDANCE
router.patch("/registrations/:id/attend", async (req, res) => {
  try {
    const reg = await EventRegistration.findById(req.params.id).populate("eventId");

    if (!reg || !req.assignedClubIds.includes(String(reg.eventId.clubId))) {
      return res.status(404).json({ message: "Not found" });
    }

    reg.status = "attended";
    await reg.save();

    await Attendance.findOneAndUpdate(
      { eventId: reg.eventId._id, studentId: reg.studentId },
      {
        eventId: reg.eventId._id,
        studentId: reg.studentId,
        registrationId: reg._id,
        checkInTime: new Date(),
      },
      { upsert: true }
    );

    await recalculateClubHealth(reg.eventId.clubId);

    res.json(reg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BULK ATTENDANCE
router.post("/attendance/bulk", async (req, res) => {
  try {
    const ids = req.body.ids || [];

    for (const id of ids) {
      const reg = await EventRegistration.findById(id).populate("eventId");
      if (!reg || !req.assignedClubIds.includes(String(reg.eventId.clubId))) continue;

      reg.status = "attended";
      await reg.save();
    }

    res.json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// STATS
router.get("/stats", async (req, res) => {
  try {
    const club = await Club.findById(req.assignedClubIds[0]);
    const events = await Event.find({ clubId: { $in: req.assignedClubIds } });

    const eventIds = events.map((e) => e._id);

    const totalRegistrations = await EventRegistration.countDocuments({ eventId: { $in: eventIds } });
    const feedbackCount = await Feedback.countDocuments({ clubId: { $in: req.assignedClubIds } });

    res.json({
      totalEvents: events.length,
      pendingEvents: events.filter((e) => e.status === "pending").length,
      totalRegistrations,
      feedbackCount,
      clubRating: club?.rating || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET FEEDBACK
router.get("/feedback", async (req, res) => {
  try {
    const feedback = await Feedback.find({ clubId: { $in: req.assignedClubIds } })
      .populate("studentId", "name email")
      .populate("eventId", "name");

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BUDGET REQUEST
router.post("/budget-request", async (req, res) => {
  try {
    const request = await BudgetRequest.create({
      clubId: req.assignedClubIds[0],
      facultyId: req.user._id,
      amount: req.body.amount,
      purpose: req.body.purpose,
    });

    await createNotification({
      userId: req.user._id,
      title: "Budget requested",
      message: `INR ${request.amount}`,
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET PROOFS
router.get("/proofs", async (req, res) => {
  try {
    const proofs = await ProofSubmission.find({ clubId: { $in: req.assignedClubIds } })
      .populate("eventId", "name");

    res.json(proofs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// RESPOND TO FEEDBACK
router.post("/feedback/respond", async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.body.feedbackId).populate("studentId", "email");

    if (!feedback) return res.status(404).json({ message: "Not found" });

    feedback.facultyResponse = req.body.response;
    await feedback.save();

    await sendEmail({
      to: feedback.studentId.email,
      subject: "Response to your feedback",
      text: req.body.response,
    });

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;