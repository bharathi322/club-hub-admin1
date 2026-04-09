import mongoose from "mongoose";

// Attachment schema (keep this from stashed changes)
const attachmentSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    originalName: { type: String, default: "" },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
    url: { type: String, default: "" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// Final event schema (merged properly)
const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },

    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "postponed"],
      default: "pending",
      index: true,
    },

    date: { type: String, required: true },
    time: { type: String, required: true },
    endTime: { type: String, default: "" },
    location: { type: String, default: "" },

    maxCapacity: { type: Number, default: 100, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    attendanceCount: { type: Number, default: 0, min: 0 },
    attendanceRate: { type: Number, default: 0, min: 0, max: 100 },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },

    planned: { type: Boolean, default: true },

    budgetRequested: { type: Number, default: 0, min: 0 },
    budgetApproved: { type: Number, default: 0, min: 0 },
    budgetSpent: { type: Number, default: 0, min: 0 },

    requiresProof: { type: Boolean, default: true },

    proofStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "approved", "rejected"],
      default: "not_submitted",
    },

    proofReviewedAt: { type: Date, default: null },
    proofReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    proofReviewComment: { type: String, default: "" },

    qrCodeToken: { type: String, default: "" },
    qrCodeDataUrl: { type: String, default: "" },

    attendanceWindowStart: { type: Date, default: null },
    attendanceWindowEnd: { type: Date, default: null },

    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

// Virtual field
eventSchema.virtual("seatsRemaining").get(function () {
  return Math.max(this.maxCapacity - this.registeredCount, 0);
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

export default mongoose.model("Event", eventSchema);