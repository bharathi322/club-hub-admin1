import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
  type: String,
  enum: ["registered", "cancelled", "attended", "absent"],
  default: "registered",
},
    confirmationCode: { type: String, required: true, trim: true },
    reminderSentAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

export default mongoose.model("EventRegistration", eventRegistrationSchema);
