import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "faculty", "student"],
      default: "student",
      index: true,
    },

    studentId: {
      type: String,
      trim: true,
      default: null,
    },

    department: { type: String, trim: true, default: "" },
    year: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },

    assignedClubs: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
    ],

    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true },

    emailVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },

    onboardingSource: {
      type: String,
      enum: ["manual", "student_signup", "admin_invite"],
      default: "manual",
    },

    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },

    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    lastActive: { type: Date, default: null },
  },
  { timestamps: true }
);

//
// ✅ Proper index (only one, no duplicates)
//
userSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { studentId: { $type: "string" } },
  }
);

//
// 🔐 Hash password before save
//
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

//
// 🔑 Compare password
//
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

//
// 🧹 Remove sensitive fields
//
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
};

export default mongoose.model("User", userSchema);