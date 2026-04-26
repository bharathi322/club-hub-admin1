import express from "express";
import Club from "../models/Club.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import { recalculateClubHealth } from "../services/healthService.js";
import { getIo } from "../socket.js";

const router = express.Router();

/* ================= GET ALL CLUBS ================= */
router.get("/", auth, async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate("facultyIds", "name email")
      .populate("members", "_id");

    const updated = [];

    for (let club of clubs) {
      // 🔥 ALWAYS RECALCULATE BEFORE SENDING
      await recalculateClubHealth(club._id);

      const freshClub = await Club.findById(club._id)
        .populate("facultyIds", "name email")
        .populate("members", "_id");

      updated.push({
        ...freshClub.toObject(),
        membersCount: freshClub.members.length,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= JOIN CLUB ================= */
router.post("/:id/join", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    if (!club.members.includes(req.user.id)) {
      club.members.push(req.user.id);
      await club.save();
    }

    // 🔥 RECALCULATE HEALTH
    await recalculateClubHealth(club._id);

    const updatedClub = await Club.findById(club._id)
      .populate("facultyIds", "name")
      .populate("members", "_id");

    const finalClub = {
      ...updatedClub.toObject(),
      membersCount: updatedClub.members.length,
    };

    // 🔥 REAL-TIME UPDATE
    getIo().emit("clubUpdated", finalClub);

    res.json(finalClub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= LEAVE CLUB ================= */
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    club.members = club.members.filter(
      (m) => m.toString() !== req.user.id
    );

    await club.save();

    // 🔥 RECALCULATE HEALTH
    await recalculateClubHealth(club._id);

    const updatedClub = await Club.findById(club._id)
      .populate("facultyIds", "name")
      .populate("members", "_id");

    const finalClub = {
      ...updatedClub.toObject(),
      membersCount: updatedClub.members.length,
    };

    getIo().emit("clubUpdated", finalClub);

    res.json(finalClub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= GET SINGLE CLUB ================= */
router.get("/:id", auth, async (req, res) => {
  try {
    if (
      req.user.role === "faculty" &&
      !(req.user.assignedClubs || []).some(
        (clubId) => String(clubId) === req.params.id
      )
    ) {
      return res
        .status(403)
        .json({ message: "Cannot access another club" });
    }

    // 🔥 RECALCULATE BEFORE RETURN
    await recalculateClubHealth(req.params.id);

    const club = await Club.findById(req.params.id).populate(
      "facultyIds",
      "name email"
    );

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= CREATE CLUB ================= */
router.post("/", auth, permit("admin"), async (req, res) => {
  try {
    // 🔥 SAFE INPUT (NO FAKE DATA)
    const { name, description, category, budgetAllocated } = req.body;

    const club = await Club.create({
      name,
      description,
      category,
      budgetAllocated,
    });

    await recalculateClubHealth(club._id);

    getIo().emit("clubCreated", club);

    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= UPDATE CLUB ================= */
router.put("/:id", auth, permit("admin"), async (req, res) => {
  try {
    const { facultyIds } = req.body;

    // only ONE faculty
    if (facultyIds && facultyIds.length > 1) {
      return res
        .status(400)
        .json({ message: "Only one faculty allowed" });
    }

    // prevent duplicate faculty
    if (facultyIds && facultyIds.length === 1) {
      const facultyId = facultyIds[0];

      const existingClub = await Club.findOne({
        facultyIds: facultyId,
        _id: { $ne: req.params.id },
      });

      if (existingClub) {
        return res.status(400).json({
          message: "Faculty already assigned to another club",
        });
      }
    }

    const club = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("facultyIds", "name email");

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    // 🔥 RECALCULATE AFTER UPDATE
    await recalculateClubHealth(req.params.id);

    getIo().emit("clubUpdated", club);

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= UPDATE BUDGET ================= */
router.patch("/:id/budget", auth, permit("admin"), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    club.budgetAllocated = Number(
      req.body.budgetAllocated || club.budgetAllocated
    );

    if (req.body.validFrom) club.validFrom = req.body.validFrom;
    if (req.body.validTo) club.validTo = req.body.validTo;

    await club.save();

    await recalculateClubHealth(club._id);

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ================= DELETE CLUB ================= */
router.delete("/:id", auth, permit("admin"), async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    getIo().emit("clubDeleted", req.params.id);

    res.json({ message: "Club deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;