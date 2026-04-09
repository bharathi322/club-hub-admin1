import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

// Routes
import authRoutes from "./routes/auth.js";
import clubRoutes from "./routes/clubs.js";
import eventRoutes from "./routes/events.js";
import complaintRoutes from "./routes/complaints.js";
import dashboardRoutes from "./routes/dashboard.js";
import studentRoutes from "./routes/student.js";
import facultyRoutes from "./routes/faculty.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import attendanceRoutes from "./routes/attendance.js";
import proofRoutes from "./routes/proofs.js";
import feedbackRoutes from "./routes/feedback.js";

// Socket helpers
import {
  initSocket,
  registerSocketUser,
  unregisterSocket,
} from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://127.0.0.1:8080",
];

// ✅ correct socket init (ONLY this)
const io = initSocket(server);

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Static uploads
app.use("/uploads", express.static("backend/uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/proofs", proofRoutes);
app.use("/api/feedback", feedbackRoutes);

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// Socket connection
io.on("connection", (socket) => {
  socket.on("register", ({ userId, role, clubIds = [] }) => {
    if (!userId) return;

    registerSocketUser(userId, socket.id);

    socket.join(String(userId));
    socket.join(role);

    clubIds.forEach((clubId) => {
      socket.join(`club:${clubId}`);
    });
  });

  socket.on("disconnect", () => {
    unregisterSocket(socket.id);
  });
});

// DB + Server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });