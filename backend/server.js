const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { setIO } = require("./helpers/socketManager");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const clubRoutes = require("./routes/clubs");
const eventRoutes = require("./routes/events");
const complaintRoutes = require("./routes/complaints");
const dashboardRoutes = require("./routes/dashboard");
const studentRoutes = require("./routes/student");
const facultyRoutes = require("./routes/faculty");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const attendanceRoutes = require("./routes/attendance");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

setIO(io);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join user-specific and role-specific rooms
  socket.on("join", ({ userId, role }) => {
    if (userId) socket.join(`user:${userId}`);
    if (role) socket.join(`role:${role}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
