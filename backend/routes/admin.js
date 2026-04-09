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

// Helper email
function createFacultyEmail(username, tempPassword, clubName, resetUrl) {
  return {
    html: `<p>Welcome to Club Hub.</p><p>You have been assigned to <strong>${clubName}</strong>.</p><p>Login: ${username}<br/>Temporary password: ${tempPassword}</p><p>Reset password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    text: `Login: ${username}, Temp password: ${tempPassword}, Reset: ${resetUrl}`,
  };
}

// CREATE CLUB
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
      message: `${club.name} created`,
      type: "success",
    });

    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ASSIGN FACULTY
router.post("/assign-faculty", async (req, res) => {
  try {
    const { name, email, clubId } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

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
        assignedClubs: [club._id],
      });
    } else {
      faculty.assignedClubs.push(club._id);
      faculty.password = tempPassword;
      faculty.mustChangePassword = true;
      await faculty.save();
    }

    const resetToken = createToken();
    faculty.resetToken = resetToken;
    faculty.resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await faculty.save();

    const resetUrl = `${process.env.FRONTEND_URL}/set-password/${resetToken}`;
    const emailBody = createFacultyEmail(faculty.email, tempPassword, club.name, resetUrl);

    await sendEmail({
      to: faculty.email,
      subject: `Club assigned`,
      html: emailBody.html,
      text: emailBody.text,
    });

    res.json({ message: "Faculty assigned", faculty, club });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ALLOCATE BUDGET
router.post("/budget/allocate", async (req, res) => {
  try {
    const { clubId, amount } = req.body;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found" });

    club.budgetAllocated = Number(amount);
    await club.save();

    await recalculateClubHealth(club._id);

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// EVENTS + PROOFS
router.get("/clubs/:id/events", async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.params.id });
    const proofs = await ProofSubmission.find({ clubId: req.params.id });

    res.json({ events, proofs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET FACULTY
router.get("/faculty", async (_req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" }).populate("assignedClubs", "name");
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET USERS
router.get("/users", async (_req, res) => {
  try {
    const users = await User.find().populate("assignedClubs", "name");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// BUDGET REQUESTS
router.get("/budget/requests", async (_req, res) => {
  try {
    const requests = await BudgetRequest.find()
      .populate("clubId", "name")
      .populate("facultyId", "name email")
      .populate("eventId", "name");

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// APPROVE / REJECT BUDGET
router.put("/budget/requests/:id", async (req, res) => {
  try {
    const request = await BudgetRequest.findById(req.params.id);

    request.status = req.body.status;
    request.remarks = req.body.remarks || "";
    request.decidedAt = new Date();

    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET PROOFS
router.get("/proofs", async (_req, res) => {
  try {
    const proofs = await ProofSubmission.find()
      .populate("eventId")
      .populate("clubId")
      .populate("facultyId");

    res.json(proofs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;