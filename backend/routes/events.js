const express = require("express");
const Event = require("../models/Event");
const auth = require("../middleware/auth");
const { notifyNewEvent, notifyEventStatusChange } = require("../helpers/notifications");
const router = express.Router();

// GET /api/events
router.get("/", auth, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events
router.post("/", auth, async (req, res) => {
  try {
    const event = await Event.create(req.body);
    // Notify students about the new event
    notifyNewEvent(event);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/events/:id
router.put("/:id", auth, async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Event not found" });
    const oldStatus = existing.status;
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Notify registered students if status changed
    if (req.body.status && req.body.status !== oldStatus) {
      notifyEventStatusChange(event, oldStatus);
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/events/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
