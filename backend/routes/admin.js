import express from "express";
import User from "../models/User.js";
import Club from "../models/Club.js";
import Event from "../models/Event.js";
import ProofSubmission from "../models/ProofSubmission.js";
import BudgetRequest from "../models/Budget.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import { randomPassword, createToken } from "../utils/auth.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { recalculateClubHealth } from "../services/healthService.js";

const router = express.Router();
router.use(auth, permit("admin"));

function createFacultyEmail(username, tempPassword, clubName, resetUrl) {
  return {
    html: `<p>Welcome to Club Hub.</p><p>You have been assigned to <strong>${clubName}</strong>.</p><p>Login: ${username}<br/>Temporary password: ${tempPassword}</p><p>Reset password on first login: <a href="${resetUrl}">${resetUrl}</a></p>`,
    text: `Welcome to Club Hub. Club: ${clubName}. Login: ${username}. Temporary password: ${tempPassword}. Reset password: ${resetUrl}`,
  };
}

router.post("/create-club", async (req, res) => {
  try {
    const club = await Club.create({
      name: req.body.name,
      description: req.body.description || "",
      category: req.body.category || "other",
      plannedEvents: Number(req.body.plannedEvents || 0),
      budgetAllocated: Number(req.body.budgetAllocated || 0),
    });

    await createNotification({
      userId: req.user._id,
      title: "Club created",
      message: `${club.name} has been created`,
      type: "success",
      metadata: { clubId: String(club._id) },
    });

    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/assign-faculty", async (req, res) => {
  try {
    const { name, email, clubId } = req.body;
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    let faculty = await User.findOne({ email: email.toLowerCase() });
    const tempPassword = randomPassword();

    if (!faculty) {
      faculty = await User.create({
        name,
        email: email.toLowerCase(),
        password: tempPassword,
        role: "faculty",
        emailVerified: true,
        mustChangePassword: true,
        onboardingSource: "admin_invite",
        assignedClubs: [club._id],
      });
    } else {
      faculty.name = name || faculty.name;
      faculty.role = "faculty";
      faculty.emailVerified = true;
      faculty.mustChangePassword = true;
      faculty.password = tempPassword;
      if (!(faculty.assignedClubs || []).some((id) => String(id) === String(club._id))) {
        faculty.assignedClubs.push(club._id);
      }
      await faculty.save();
    }

    if (!club.facultyIds.some((id) => String(id) === String(faculty._id))) {
      club.facultyIds.push(faculty._id);
      await club.save();
    }

    const resetToken = createToken();
    faculty.resetToken = resetToken;
    faculty.resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await faculty.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/set-password/${resetToken}`;
    const emailBody = createFacultyEmail(faculty.email, tempPassword, club.name, resetUrl);

    await sendEmail({
      to: faculty.email,
      subject: `Club Hub access for ${club.name}`,
      template: "faculty-assigned",
      html: emailBody.html,
      text: emailBody.text,
      metadata: { clubId: String(club._id), facultyId: String(faculty._id) },
    });

    await sendEmail({
      to: req.user.email,
      subject: `Faculty assigned to ${club.name}`,
      template: "admin-club-created",
      html: `<p>${faculty.name} has been assigned to ${club.name}.</p>`,
      text: `${faculty.name} has been assigned to ${club.name}.`,
      metadata: { clubId: String(club._id), facultyId: String(faculty._id) },
    });

    res.status(201).json({
      message: "Faculty assigned and credentials emailed",
      faculty: faculty.toSafeObject(),
      club,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/budget/allocate", async (req, res) => {
  try {
    const { clubId, amount, validFrom, validTo } = req.body;
    const club = await Club.findById(clubId).populate("facultyIds", "email name");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    club.budgetAllocated = Number(amount);
    club.validFrom = validFrom || null;
    club.validTo = validTo || null;
    await club.save();
    await recalculateClubHealth(club._id);

    await Promise.all(
      club.facultyIds.map((faculty) =>
        sendEmail({
          to: faculty.email,
          subject: `Budget allocated for ${club.name}`,
          template: "budget-allocated",
          html: `<p>Allocated amount: INR ${amount}.</p>`,
          text: `Allocated amount: INR ${amount}.`,
          metadata: { clubId: String(club._id), facultyId: String(faculty._id) },
        })
      )
    );

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/clubs/:id/events", async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.params.id });
    const proofs = await ProofSubmission.find({ clubId: req.params.id });
    res.json({ events, proofs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/faculty", async (_req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" }).populate("assignedClubs", "name");
    res.json(faculty.map((item) => item.toSafeObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/users", async (_req, res) => {
  try {
    const users = await User.find().populate("assignedClubs", "name");
    res.json(users.map((item) => item.toSafeObject()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/budget/requests", async (_req, res) => {
  try {
    const requests = await BudgetRequest.find()
      .populate("clubId", "name")
      .populate("facultyId", "name email")
      .populate("eventId", "name")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/budget/requests/:id", async (req, res) => {
  try {
    const request = await BudgetRequest.findById(req.params.id)
      .populate("facultyId", "email name")
      .populate("clubId", "name");
    if (!request) {
      return res.status(404).json({ message: "Budget request not found" });
    }

    request.status = req.body.status;
    request.remarks = req.body.remarks || "";
    request.decidedAt = new Date();
    request.decidedBy = req.user._id;
    await request.save();

    await sendEmail({
      to: request.facultyId.email,
      subject: `Budget request ${request.status}`,
      template: "budget-request-review",
      html: `<p>Your budget request for ${request.clubId.name} was ${request.status}.</p>`,
      text: `Your budget request for ${request.clubId.name} was ${request.status}.`,
      metadata: { requestId: String(request._id), facultyId: String(request.facultyId._id) },
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/proofs", async (_req, res) => {
  try {
    const proofs = await ProofSubmission.find()
      .populate("eventId", "name date status")
      .populate("clubId", "name")
      .populate("facultyId", "name email")
      .sort({ updatedAt: -1 });
    res.json(proofs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
