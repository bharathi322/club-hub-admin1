import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["technical", "cultural", "sports", "arts", "social", "other"],
      default: "other",
    },
    facultyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    budgetAllocated: { type: Number, default: 0, min: 0 },
    budgetUsed: { type: Number, default: 0, min: 0 },
    budgetPending: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    healthScore: { type: Number, default: 0, min: 0, max: 100 },
    healthStatus: {
      type: String,
      enum: ["healthy", "warning", "critical"],
      default: "critical",
    },
    membersCount: { type: Number, default: 0 },
    plannedEvents: { type: Number, default: 0 },
    eventCount: { type: Number, default: 0 },
    participationRate: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    proofSubmissionRate: { type: Number, default: 0 },
    budgetEfficiency: { type: Number, default: 0 },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
  },
  { timestamps: true }
);

clubSchema.methods.toDashboardCard = function toDashboardCard() {
  return {
    _id: this._id,
    name: this.name,
    rating: this.rating,
    healthScore: this.healthScore,
    healthStatus: this.healthStatus,
    budgetAllocated: this.budgetAllocated,
    budgetUsed: this.budgetUsed,
    membersCount: this.membersCount,
    participationRate: this.participationRate,
    attendanceRate: this.attendanceRate,
  };
};

export default mongoose.model("Club", clubSchema);
