import Notification from "../models/Notification.js";
import User from "../models/User.js";
import EventRegistration from "../models/EventRegistration.js";
import { sendEmail, eventRegistrationEmail, eventReminderEmail, proofSubmittedEmail, proofReviewEmail, budgetAllocatedEmail } from "./emailService.js";
import { emitToUser, emitToRole } from "./socketManager.js";

// New Event Notification
export async function notifyNewEvent(event) {
  try {
    const faculty = await User.find({ role: "faculty", isActive: true });

    const notifications = faculty.map((f) => ({
      user: f._id,
      title: "New Event Created",
      description: `${event.name} created`,
      type: "info",
      relatedEvent: event._id,
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    emitToRole("student", "new-event", { event });
  } catch (err) {
    console.error("notifyNewEvent error:", err);
  }
}

// Event Status Change
export async function notifyEventStatusChange(event) {
  try {
    const regs = await EventRegistration.find({ event: event._id }).select("student");

    const notifications = regs.map((r) => ({
      user: r.student,
      title: "Event Status Updated",
      description: `${event.name} is now ${event.status}`,
      type: "info",
      relatedEvent: event._id,
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    for (const r of regs) {
      emitToUser(r.student.toString(), "event-status-changed", { event });
    }
  } catch (err) {
    console.error("notifyEventStatusChange error:", err);
  }
}

// Registration
export async function notifyEventRegistration(student, event) {
  try {
    const emailData = eventRegistrationEmail(
      student.name,
      event.name,
      event.club,
      event.date,
      event.time
    );

    await sendEmail({ to: student.email, ...emailData });

    emitToRole("faculty", "new-registration", {
      student: { name: student.name },
      event,
    });

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
    console.error("notifyEventRegistration error:", err);
  }
}

// Proof Submitted
export async function notifyProofSubmitted(faculty, club, event) {
  try {
    const admins = await User.find({ role: "admin" }).select("_id email");

    const notifications = admins.map((a) => ({
      user: a._id,
      title: "Proof Submitted",
      description: `${faculty.name} submitted proofs for "${event.name}" (${club.name})`,
      type: "info",
      relatedEvent: event._id,
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    emitToRole("admin", "proof-submitted", {
      faculty: faculty.name,
      club: club.name,
      event,
    });

    for (const admin of admins) {
      const emailData = proofSubmittedEmail(
        faculty.name,
        club.name,
        event.name
      );
      await sendEmail({ to: admin.email, ...emailData });
    }
  } catch (err) {
    console.error("notifyProofSubmitted error:", err);
  }
}

// Proof Reviewed
export async function notifyProofReviewed(faculty, event, status, remarks) {
  try {
    await Notification.create({
      user: faculty._id,
      title: `Proof ${status === "approved" ? "Approved" : "Rejected"}`,
      description: `Your proof for "${event.name}" was ${status}.${remarks ? ` Remarks: ${remarks}` : ""}`,
      type: status === "approved" ? "success" : "warning",
      relatedEvent: event._id,
    });

    emitToUser(faculty._id.toString(), "proof-reviewed", {
      event,
      status,
      remarks,
    });

    const emailData = proofReviewEmail(
      faculty.email,
      event.name,
      status,
      remarks
    );

    await sendEmail(emailData);
  } catch (err) {
    console.error("notifyProofReviewed error:", err);
  }
}

// Budget Allocation
export async function notifyBudgetAllocated(faculty, club, amount) {
  try {
    await Notification.create({
      user: faculty._id,
      title: "Budget Allocated",
      description: `₹${amount.toLocaleString("en-IN")} allocated to ${club.name}`,
      type: "success",
    });

    emitToUser(faculty._id.toString(), "budget-allocated", {
      club: club.name,
      amount,
    });

    const emailData = budgetAllocatedEmail(
      faculty.email,
      faculty.name,
      club.name,
      amount
    );

    await sendEmail(emailData);
  } catch (err) {
    console.error("notifyBudgetAllocated error:", err);
  }
}

// Budget Threshold
export async function checkBudgetThreshold(club, totalUsed) {
  try {
    if (!club.budgetAllocated) return;

    const percent = Math.round((totalUsed / club.budgetAllocated) * 100);
    const thresholds = [100, 90, 80];

    for (const t of thresholds) {
      if (percent >= t) {
        const faculty = await User.find({
          assignedClub: club._id,
          role: "faculty",
        });

        for (const f of faculty) {
          emitToUser(f._id.toString(), "budget-alert", {
            club: club.name,
            percent,
          });

          await Notification.create({
            user: f._id,
            title: `Budget Alert: ${percent}% used`,
            description: `${club.name} has used ${percent}% of budget`,
            type: percent >= 100 ? "warning" : "info",
          });
        }

        break;
      }
    }
  } catch (err) {
    console.error("checkBudgetThreshold error:", err);
  }
}