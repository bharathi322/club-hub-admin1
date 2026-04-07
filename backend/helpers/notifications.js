const Notification = require("../models/Notification");
const EventRegistration = require("../models/EventRegistration");
const User = require("../models/User");
const { sendEmail, eventRegistrationEmail, eventReminderEmail } = require("./emailService");
const { emitToUser, emitToRole } = require("./socketManager");

/**
 * Notify all students about a new event being created.
 */
async function notifyNewEvent(event) {
  try {
    const students = await User.find({ role: "student" }).select("_id");
    const notifications = students.map((s) => ({
      user: s._id,
      title: "New Event Posted",
      description: `"${event.name}" by ${event.club} on ${event.date}`,
      type: "info",
      relatedEvent: event._id,
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    // Real-time push
    emitToRole("student", "new-event", { event });
  } catch (err) {
    console.error("notifyNewEvent error:", err.message);
  }
}

/**
 * Notify registered students when an event status changes.
 */
async function notifyEventStatusChange(event, oldStatus) {
  try {
    const regs = await EventRegistration.find({ event: event._id }).select("student");
    const typeMap = { approved: "success", pending: "warning", warning: "warning" };
    const notifications = regs.map((r) => ({
      user: r.student,
      title: "Event Status Updated",
      description: `"${event.name}" changed from ${oldStatus} to ${event.status}`,
      type: typeMap[event.status] || "info",
      relatedEvent: event._id,
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    // Real-time push to each registered student
    for (const r of regs) {
      emitToUser(r.student.toString(), "event-status-changed", { event });
    }
  } catch (err) {
    console.error("notifyEventStatusChange error:", err.message);
  }
}

/**
 * Send registration confirmation email + notify faculty.
 */
async function notifyEventRegistration(student, event) {
  try {
    // Email to student
    const emailData = eventRegistrationEmail(student.name, event.name, event.club, event.date, event.time);
    await sendEmail({ to: student.email, ...emailData });

    // Notify faculty in real-time
    emitToRole("faculty", "new-registration", { student: { name: student.name }, event });

    // In-app notification to faculty
    const faculty = await User.find({ role: "faculty" }).populate("assignedClub");
    for (const f of faculty) {
      if (f.assignedClub?.name === event.club) {
        await Notification.create({
          user: f._id,
          title: "New Registration",
          description: `${student.name} registered for "${event.name}"`,
          type: "info",
          relatedEvent: event._id,
        });
        emitToUser(f._id.toString(), "notification", {
          title: "New Registration",
          description: `${student.name} registered for "${event.name}"`,
        });
      }
    }
  } catch (err) {
    console.error("notifyEventRegistration error:", err.message);
  }
}

/**
 * Notify admin when faculty submits proofs.
 */
async function notifyProofSubmitted(faculty, club, event) {
  try {
    const admins = await User.find({ role: "admin" }).select("_id email");
    const notifications = admins.map((a) => ({
      user: a._id,
      title: "Proof Submitted",
      description: `${faculty.name} submitted proofs for "${event.name}" (${club.name})`,
      type: "info",
      relatedEvent: event._id,
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    emitToRole("admin", "proof-submitted", { faculty: faculty.name, club: club.name, event });

    // Email to admins
    const { proofSubmittedEmail } = require("./emailService");
    for (const admin of admins) {
      const emailData = proofSubmittedEmail(faculty.name, club.name, event.name);
      await sendEmail({ to: admin.email, ...emailData });
    }
  } catch (err) {
    console.error("notifyProofSubmitted error:", err.message);
  }
}

/**
 * Notify faculty when admin reviews their proof.
 */
async function notifyProofReviewed(faculty, event, status, remarks) {
  try {
    await Notification.create({
      user: faculty._id,
      title: `Proof ${status === "approved" ? "Approved" : "Rejected"}`,
      description: `Your proof for "${event.name}" was ${status}.${remarks ? ` Remarks: ${remarks}` : ""}`,
      type: status === "approved" ? "success" : "warning",
      relatedEvent: event._id,
    });

    emitToUser(faculty._id.toString(), "proof-reviewed", { event, status, remarks });

    // Email
    const { proofReviewEmail } = require("./emailService");
    const emailData = proofReviewEmail(faculty.email, event.name, status, remarks);
    await sendEmail(emailData);
  } catch (err) {
    console.error("notifyProofReviewed error:", err.message);
  }
}

/**
 * Notify budget allocation.
 */
async function notifyBudgetAllocated(faculty, club, amount) {
  try {
    await Notification.create({
      user: faculty._id,
      title: "Budget Allocated",
      description: `₹${amount.toLocaleString("en-IN")} allocated to ${club.name}`,
      type: "success",
    });

    emitToUser(faculty._id.toString(), "budget-allocated", { club: club.name, amount });

    const { budgetAllocatedEmail } = require("./emailService");
    const emailData = budgetAllocatedEmail(faculty.email, faculty.name, club.name, amount);
    await sendEmail(emailData);
  } catch (err) {
    console.error("notifyBudgetAllocated error:", err.message);
  }
}

/**
 * Budget threshold alert (80%, 90%, 100%)
 */
async function checkBudgetThreshold(club, totalUsed) {
  try {
    if (!club.budgetAllocated || club.budgetAllocated === 0) return;
    const percent = Math.round((totalUsed / club.budgetAllocated) * 100);
    const thresholds = [100, 90, 80];

    for (const t of thresholds) {
      if (percent >= t) {
        const faculty = await User.find({ assignedClub: club._id, role: "faculty" });
        for (const f of faculty) {
          emitToUser(f._id.toString(), "budget-alert", { club: club.name, percent });
          await Notification.create({
            user: f._id,
            title: `Budget Alert: ${percent}% used`,
            description: `${club.name} has used ${percent}% of allocated budget`,
            type: percent >= 100 ? "warning" : "info",
          });
        }
        break; // Only send the highest threshold
      }
    }
  } catch (err) {
    console.error("checkBudgetThreshold error:", err.message);
  }
}

module.exports = {
  notifyNewEvent,
  notifyEventStatusChange,
  notifyEventRegistration,
  notifyProofSubmitted,
  notifyProofReviewed,
  notifyBudgetAllocated,
  checkBudgetThreshold,
};
