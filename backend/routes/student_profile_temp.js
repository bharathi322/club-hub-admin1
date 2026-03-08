const express = require("express");
const EventRegistration = require("../models/EventRegistration");
const Feedback = require("../models/Feedback");
const auth = require("../middleware/auth");
const router = express.Router();

// Get student's registration history
router.get("/:studentId/registrations", auth, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const registrations = await EventRegistration.find({ student: studentId })
      .populate("event")
      .sort({ registrationDate: -1 });
    res.json(registrations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get feedback given by a student
router.get("/:studentId/feedback", auth, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const feedback = await Feedback.find({ student: studentId })
      .populate("event")
      .sort({ dateGiven: -1 });
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
