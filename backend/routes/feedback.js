import express from "express";

const router = express.Router();

// GET all feedback
router.get("/", async (req, res) => {
  res.json([]);
});

// CREATE feedback
router.post("/", async (req, res) => {
  const { rating, comment } = req.body;

  res.json({
    message: "Feedback submitted",
    rating,
    comment,
  });
});

export default router;