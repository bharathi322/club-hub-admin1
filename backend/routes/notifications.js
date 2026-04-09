import express from "express";
import Notification from "../models/Notification.js";
import auth from "../middleware/auth.js";
import { getIo } from "../socket.js";

const router = express.Router();
export async function checkEventRisk(event) {
  try {
    let risk = "low";

    if (event.budgetSpent > event.budgetApproved) {
      risk = "high";
    } else if (event.attendanceRate < 50) {
      risk = "medium";
    }

    return risk;
  } catch (err) {
    console.error("checkEventRisk error:", err);
    return "low";
  }
}

router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    getIo().to(String(req.user._id)).emit("notification:updated", notification);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    getIo().to(String(req.user._id)).emit("notification:cleared", { userId: String(req.user._id) });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
