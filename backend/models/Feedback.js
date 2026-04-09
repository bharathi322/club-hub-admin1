import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, default: "" },
    facultyResponse: { type: String, default: "" },
    facultyRespondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

feedbackSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("Feedback", feedbackSchema);
