import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const user = await User.findOne({ email: "admin@clubhub.edu" });

user.password = "Admin@2024"; // plain password
await user.save();

console.log("Password reset done");
process.exit();