import express from "express";
import Club from "../models/Club.js";
import auth from "../middleware/auth.js";
import permit from "../middleware/role.js";
import { recalculateClubHealth } from "../services/healthService.js";
import { getIo } from "../socket.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const filter =
      req.user.role === "faculty"
        ? { _id: { $in: req.user.assignedClubs || [] } }
        : {};
    const clubs = await Club.find(filter).populate("facultyIds", "name email");
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    if (
      req.user.role === "faculty" &&
      !(req.user.assignedClubs || []).some((clubId) => String(clubId) === req.params.id)
    ) {
      return res.status(403).json({ message: "Cannot access another club" });
    }

    const club = await Club.findById(req.params.id).populate("facultyIds", "name email");
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", auth, permit("admin"), async (req, res) => {
  try {
    const club = await Club.create(req.body);
    await recalculateClubHealth(club._id);
    getIo().to("admin").emit("club:created", club);
    getIo().to("student").emit("club:created", club);
    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", auth, permit("admin"), async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    await recalculateClubHealth(club._id);
    getIo().to("admin").emit("club:updated", club);
    getIo().to(`club:${club._id}`).emit("club:updated", club);
    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/budget", auth, permit("admin"), async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    club.budgetAllocated = Number(req.body.budgetAllocated || club.budgetAllocated);
    if (req.body.validFrom) club.validFrom = req.body.validFrom;
    if (req.body.validTo) club.validTo = req.body.validTo;
    await club.save();
    await recalculateClubHealth(club._id);

    res.json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", auth, permit("admin", "faculty"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Restrict faculty to their own club
    if (req.user.role === "faculty") {
      const clubId = event.clubId.toString();

      if (!req.user.assignedClubs.includes(clubId)) {
        return res.status(403).json({ message: "Not allowed" });
      }
    }

    await event.deleteOne();

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
