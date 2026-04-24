import jwt from "jsonwebtoken";
import crypto from "crypto";

// create JWT token
export const signToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// random reset token
export const createToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// 6-digit confirmation code
export const createConfirmationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// random password
export const randomPassword = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";

  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

// numeric OTP
export const randomNumericCode = (length = 6) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};