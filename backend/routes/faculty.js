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
import User from "../models/User.js";
import PDFDocument from "pdfkit";
    import path from "path";
import fs from "fs";


const router = express.Router();

router.get("/", auth, permit("admin"), async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .select("_id name email");

    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
.populate("studentId", "name email regNo")
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

// GET students for event
router.get("/events/:eventId/registrations", async (req, res) => {
  try {
    const { eventId } = req.params;

    const data = await EventRegistration.find({ eventId })
      .populate("studentId", "name email");

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SUBMIT attendance
router.post("/events/:eventId/attendance", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { presentStudentIds } = req.body;

    // mark present
    await EventRegistration.updateMany(
      { eventId, studentId: { $in: presentStudentIds } },
      { $set: { status: "attended" } }
    );

    // mark absent
    await EventRegistration.updateMany(
      { eventId, studentId: { $nin: presentStudentIds }, status: "registered" },
      { $set: { status: "absent" } }
    );

    res.json({ message: "Attendance saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

router.post("/events/:id/mark-absent", async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const now = new Date();
    const eventTime = new Date(`${event.date} ${event.time}`);

    if (now < eventTime) {
      return res.status(400).json({
        message: "Event not finished yet",
      });
    }

    // ✅ mark all remaining as absent
    await EventRegistration.updateMany(
      {
        eventId,
        status: "registered",
      },
      {
        $set: { status: "absent" },
      }
    );

    res.json({ message: "Absentees marked" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    res.json({ message: "Password updated" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/events/:eventId/attendance", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { presentStudentIds } = req.body;

    // mark present
    await EventRegistration.updateMany(
      {
        eventId,
        studentId: { $in: presentStudentIds },
      },
      { $set: { status: "attended" } }
    );

    // remaining → absent
    await EventRegistration.updateMany(
      {
        eventId,
        studentId: { $nin: presentStudentIds },
      },
      { $set: { status: "absent" } }
    );

    res.json({ message: "Attendance updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/attendance/bulk", async (req, res) => {
  try {
    const { ids } = req.body;

    // mark selected as attended
    await EventRegistration.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "attended" } }
    );

    // find eventId from one record
    const sample = await EventRegistration.findById(ids[0]);

    // mark remaining as absent
    await EventRegistration.updateMany(
      {
        eventId: sample.eventId,
        _id: { $nin: ids },
        status: "registered",
      },
      { $set: { status: "absent" } }
    );

    res.json({ message: "Attendance updated", count: ids.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
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


router.get("/attendance/:eventId/pdf", async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("clubId", "name");

    const registrations = await EventRegistration.find({ eventId })
      .populate("studentId", "name email studentId");

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance-sheet.pdf"
    );

    doc.pipe(res);

const logoPath = path.join(process.cwd(), "backend", "logo.png");

if (fs.existsSync(logoPath)) {
  doc.image(logoPath, 40, 30, { width: 50 });
}

    // ================= HEADER =================
    doc
      .fontSize(16)
      .text("DSCASC", { align: "center" });

    doc.moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Club: ${event?.clubId?.name || "-"}`, { align: "center" });

    doc.text(`Event: ${event?.name || "-"}`, { align: "center" });
    doc.text(`Date: ${event?.date || "-"}`, { align: "center" });

    doc.moveDown(1.5);

    // ================= TABLE =================
    const startX = 40;
    let y = 140;

    const col = {
  sl: startX,
  reg: startX + 40,
  name: startX + 140,
  sign: startX + 380,
};

    // Header
    doc.fontSize(11).font("Helvetica-Bold");
    doc.text("Sl No", col.sl, y);
    doc.text("Reg No", col.reg, y);
    doc.text("Student Name", col.name, y);
doc.text("Signature", col.sign, y);

    y += 15;

    doc.moveTo(startX, y).lineTo(550, y).stroke();

    y += 10;

    doc.font("Helvetica");

    registrations.forEach((r, index) => {
      const student = r.studentId;

      const regNo = student?.regNo || "-";

      doc.text(index + 1, col.sl, y);
      doc.text(regNo, col.reg, y);
      doc.text(student?.name || "-", col.name, y);

      // signature line
      doc.moveTo(col.sign, y + 12).lineTo(550, y + 12).stroke();

      y += 25;

      if (y > 750) {
        doc.addPage();
        y = 60;
      }
    });

    // ================= FOOTER =================
    doc.moveDown(2);

    doc.text("Faculty Signature: ____________________", 40, y + 20);

    doc.end();

  } catch (err) {
  console.error(err);

  if (!res.headersSent) {
    res.status(500).json({ message: err.message });
  }
}
});

export default router;
