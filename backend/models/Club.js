const mongoose = require("mongoose");

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ["healthy", "warning", "critical"], default: "healthy" },
  membersCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  budgetAllocated: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Club", clubSchema);
