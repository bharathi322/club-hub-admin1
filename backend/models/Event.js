const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  club: { type: String, required: true },
  status: { type: String, enum: ["approved", "pending", "warning"], default: "pending" },
  rating: { type: String, default: "--" },
  date: { type: String, required: true },
  time: { type: String, required: true },
  description: { type: String, default: "" },
  maxSeats: { type: Number, default: 0 },         // 0 = unlimited
  budgetUsed: { type: Number, default: 0 },
  budgetProof: [{ type: String }],
  photos: [{ type: String }],
  documents: [{ type: String }],
  proofStatus: {
    type: String,
    enum: ["pending", "submitted", "approved", "rejected"],
    default: "pending",
  },
  proofRemarks: { type: String, default: "" },
  qrCode: { type: String, default: "" },           // unique QR token for attendance
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
