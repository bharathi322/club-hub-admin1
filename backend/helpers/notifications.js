import Notification from "../models/Notification.js";
import User from "../models/User.js";
import EventRegistration from "../models/EventRegistration.js";

export async function notifyNewEvent(event) {
  try {
    const faculty = await User.find({ role: "faculty", isActive: true });

    console.log("Faculty found:", faculty.length);

    const notifications = faculty.map((f) => ({
      user: f._id,
      title: "New Event Created",
      description: `${event.name} created`,
      type: "info",
      relatedEvent: event._id,
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
      console.log("Notifications inserted");
    }
  } catch (err) {
    console.error("notifyNewEvent error:", err);
  }
}

export async function notifyEventStatusChange(event, oldStatus) {
  try {
    const regs = await EventRegistration.find({ event: event._id }).select(
      "student"
    );

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
  } catch (err) {
    console.error("notifyEventStatusChange error:", err);
  }
}