import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const hash = await bcrypt.hash("Admin@2024", 10);

  await User.updateOne(
    { email: "admin@clubhub.edu" },
    { password: hash }
  );

  console.log("Password updated successfully");
  process.exit();
}

run();