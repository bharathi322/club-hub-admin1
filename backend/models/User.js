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
    profileImage: {
  type: String,
  default: "",
},

    // ✅ FIXED: only required for students
    regNo: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    // (kept as-is to not affect existing logic)
    studentId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
    },

    department: { type: String, trim: true, default: "" },
    year: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },

    assignedClubs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],
      default: [],
    },

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


// ✅ EXISTING INDEX (unchanged)
userSchema.index(
  { studentId: 1 },
  {
    unique: true,
    partialFilterExpression: { studentId: { $type: "string" } },
  }
);


// ✅ ADD THIS VALIDATION (SAFE, DOES NOT BREAK LOGIC)
userSchema.pre("validate", function (next) {
  if (this.role === "student" && !this.regNo) {
    return next(new Error("Register number is required for students"));
  }
  next();
});


// PASSWORD HASH
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


// PASSWORD COMPARE
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};


// SAFE OBJECT
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.resetToken;
  delete obj.resetTokenExpiry;
  return obj;
};
userSchema.pre("validate", function (next) {
  if (this.role === "student") {
    if (!this.regNo) {
      return next(new Error("Register number required"));
    }

    const pattern = /^U\d{2}[A-Z]{2}\d{6}$/;

    if (!pattern.test(this.regNo)) {
      return next(new Error("Invalid register number format"));
    }
  }
  next();
});
export default mongoose.model("User", userSchema);