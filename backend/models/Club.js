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
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
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

clubSchema.pre("save", function (next) {
  this.membersCount = this.members.length;
  next();
});

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

clubSchema.methods.calculateHealth = function () {
  let score = 0;

  // events
  score += this.eventCount * 10;

  // participation
  score += this.participationRate * 0.3;

  // attendance
  score += this.attendanceRate * 0.2;

  // budget usage efficiency
  if (this.budgetAllocated > 0) {
    const efficiency =
      (this.budgetUsed / this.budgetAllocated) * 100;
    score += efficiency * 0.2;
  }

  // proof submission
  score += this.proofSubmissionRate * 0.3;

  this.healthScore = Math.min(100, Math.round(score));

  if (this.healthScore >= 70) this.healthStatus = "healthy";
  else if (this.healthScore >= 40) this.healthStatus = "warning";
  else this.healthStatus = "critical";
};

export default mongoose.model("Club", clubSchema);
