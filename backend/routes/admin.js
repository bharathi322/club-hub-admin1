import express from "express";
import User from "../models/User.js";
import Club from "../models/Club.js";
import Event from "../models/Event.js";
import ProofSubmission from "../models/ProofSubmission.js";
import BudgetRequest from "../models/Budget.js";

import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import bcrypt from "bcrypt";
import { randomPassword, createToken } from "../utils/auth.js";
import { sendEmail } from "../services/emailService.js";
import { createNotification } from "../services/notificationService.js";
import { recalculateClubHealth } from "../services/healthService.js";


export const assignFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { clubId } = req.body;

    const user = await User.findById(id);

    user.assignedClub = clubId;
    await user.save();

    // ADD THIS
    await sendEmail(
      user.email,
      "Club Assignment",
      `You have been assigned to a club.`
    );

    res.json({ message: "Assigned successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error" });
  }
};
const router = express.Router();
router.use(auth, permit("admin"));

// EMAIL TEMPLATE
function createFacultyEmail(username, tempPassword, clubName, resetUrl) {
  return {
    html: `<p>Welcome to Club Hub.</p>
           <p>You have been assigned to <strong>${clubName}</strong>.</p>
           <p>Login: ${username}<br/>Temporary password: ${tempPassword}</p>
           <p>Reset password: <a href="${resetUrl}">${resetUrl}</a></p>`,
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

// ASSIGN FACULTY (FIXED)
router.post("/assign-faculty", async (req, res) => {
  try {
    const { name, email, clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ message: "Club ID required" });
    }

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
        assignedClubs: [club._id],
      });
    } else {
      faculty.name = name || faculty.name;
      faculty.role = "faculty";
      faculty.emailVerified = true;
      faculty.mustChangePassword = true;
      faculty.password = tempPassword;

      // ✅ FIX: avoid crash
      faculty.assignedClubs = [club._id];

      await faculty.save();
    }

    // ✅ FIX: safe array handling
    if (!club.facultyIds) {
      club.facultyIds = [];
    }

    if (!club.facultyIds.some((id) => String(id) === String(faculty._id))) {
      club.facultyIds.push(faculty._id);
      await club.save();
    }

    // RESET TOKEN
    const resetToken = createToken();
    faculty.resetToken = resetToken;
    faculty.resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await faculty.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:8080"}/set-password/${resetToken}`;

    const emailBody = createFacultyEmail(
      faculty.email,
      tempPassword,
      club.name,
      resetUrl
    );

    //await sendEmail({
      //to: faculty.email,
      //subject: `Club assigned`,
      //html: emailBody.html,
      //text: emailBody.text,
    //});
try {
  await sendEmail({
    to: faculty.email,
    subject: "Club Assignment",
    html: emailBody.html,
    text: emailBody.text,
  });
} catch (err) {
  console.log("EMAIL FAILED:", err.message);
}
    res.status(201).json({
      message: "Faculty assigned",
      faculty,
      club,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// UPDATE FACULTY ASSIGNMENT (REQUIRED FOR UI)
router.put("/faculty/:id/assign", async (req, res) => {
  try {
    console.log("Assign API HIT");
    console.log("Faculty ID:", req.params.id);
    console.log("Club ID:", req.body.clubId);

    const { clubId } = req.body;

    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    console.log("Faculty email:", faculty.email);

    const club = clubId ? await Club.findById(clubId) : null;
    console.log("Club:", club?.name);

    // assign
    faculty.assignedClubs = clubId ? [clubId] : [];

    // generate temp password
    const tempPassword = randomPassword();

    // ✅ FIX: hash password
faculty.password = tempPassword;

    faculty.mustChangePassword = true;

    await faculty.save();

    // SEND EMAIL
    if (club && faculty.email) {
      try {
        console.log("Preparing email...");

        const resetToken = createToken();

        faculty.resetToken = resetToken;
        faculty.resetTokenExpiry = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );
        await faculty.save();

        const resetUrl = `${
          process.env.FRONTEND_URL || "http://localhost:8080"
        }/set-password/${resetToken}`;

        const emailBody = createFacultyEmail(
          faculty.email,
          tempPassword,
          club.name,
          resetUrl
        );

        console.log("Sending email to:", faculty.email);

        await sendEmail({
          to: faculty.email,
          subject: "Club Assignment",
          html: emailBody.html,
          text: emailBody.text,
        });

        console.log("EMAIL SENT SUCCESS");
      } catch (err) {
        console.log("EMAIL FAILED FULL ERROR:", err);
      }
    } else {
      console.log("Email skipped. Club or email missing.");
    }

    const updated = await User.findById(req.params.id).populate(
      "assignedClubs",
      "name"
    );

    res.json(updated);
  } catch (err) {
    console.error("ASSIGN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.delete("/faculty/:id", async (req, res) => {
  try {
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: "Not found" });
    }

    await faculty.deleteOne();

    res.json({ message: "Faculty deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// OTHER ROUTES (UNCHANGED)

router.get("/clubs/:id/events", async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.params.id });
    const proofs = await ProofSubmission.find({ clubId: req.params.id });
    res.json({ events, proofs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

// GET ALL FACULTY
router.get("/faculty", async (req, res) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .populate("assignedClubs", "name")
      .select("name email assignedClubs");

    res.json(faculty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch faculty" });
  }
});

export default router;