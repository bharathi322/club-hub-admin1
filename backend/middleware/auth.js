import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    console.log("HEADER:", header);

    if (!header || !header.startsWith("Bearer ")) {
      console.log("NO HEADER");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];
    console.log("TOKEN:", token);

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("DECODED:", decoded);
    } catch (err) {
      console.log("JWT ERROR:", err.message);
      return res.status(401).json({ message: "JWT FAILED" });
    }

    const user = await User.findById(decoded.id);
    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(401).json({ message: "USER NOT FOUND" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("FINAL ERROR:", error.message);
    res.status(401).json({ message: "Token invalid or expired" });
  }
}