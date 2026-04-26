import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  entity: String,
  entityId: String,
  details: Object,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("AuditLog", auditSchema);