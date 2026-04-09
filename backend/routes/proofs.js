import express from "express";

const router = express.Router();

// GET all proofs
router.get("/", async (req, res) => {
  res.json([]);
});

// CREATE proof
router.post("/", async (req, res) => {
  res.json({ message: "Proof uploaded" });
});

export default router;