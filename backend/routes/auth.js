import express from "express";
import User from "../models/User.js";
import { signToken, randomNumericCode, createToken } from "../utils/auth.js";
import { sendEmail } from "../services/emailService.js";
import bcrypt from "bcryptjs";

const router = express.Router();

function safeUser(user) {
  return user.toSafeObject ? user.toSafeObject() : user;
}

// LOGIN
router.post("/login", async (req, res) => {
  console.log("LOGIN API HIT");

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    console.log("USER:", user?.email);

    const valid = await bcrypt.compare(password, user.password);
    console.log("PASSWORD MATCH:", valid);

    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    return res.json({
      token: signToken(user._id),
      user: safeUser(user),
    });

  } catch (error) {
    console.log("ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// REGISTER (student)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, studentId, department, year } = req.body;

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { studentId }],
    });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = randomNumericCode(6);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      studentId,
      department,
      year,
      role: "student",
      otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      emailVerified: false,
    });

    await sendEmail({
      to: user.email,
      subject: "Verify account",
      html: `<p>Your OTP is <b>${otp}</b></p>`,
      text: `OTP: ${otp}`,
    });

    res.json({ message: "OTP sent", email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.emailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      token: signToken(user._id),
      user: safeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHANGE PASSWORD
router.post("/change-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword, token } = req.body;

    const user = token
      ? await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } })
      : await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!token) {
const valid = await bcrypt.compare(password, user.password);
console.log("PASSWORD MATCH:", valid);
      if (!valid) return res.status(401).json({ message: "Wrong password" });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    user.mustChangePassword = false;

    await user.save();

    res.json({
      message: "Password updated",
      token: signToken(user._id),
      user: safeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: "If exists, email sent" });

    const resetToken = createToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/set-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset password",
      html: `<a href="${resetUrl}">Reset</a>`,
      text: resetUrl,
    });

    res.json({ message: "Reset email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;