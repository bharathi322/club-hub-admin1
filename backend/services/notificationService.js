import Notification from "../models/Notification.js";
import { emitToUser } from "../socketManager.js";

// Create single notification
export const createNotification = async ({
  userId,
  title,
  message,
  type = "info",
  relatedEvent = null,
}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      description: message,
      type,
      relatedEvent,
    });

    emitToUser(userId.toString(), "notification", {
      title,
      description: message,
      type,
    });

    return notification;
  } catch (err) {
    console.error("createNotification error:", err);
  }
};

// Notify multiple users
export const notifyMany = async (userIds = [], payload = {}) => {
  try {
    if (!userIds.length) return;

    const notifications = userIds.map((id) => ({
      user: id,
      title: payload.title || "Notification",
      description: payload.description || "",
      type: payload.type || "info",
      relatedEvent: payload.relatedEvent || null,
    }));

    await Notification.insertMany(notifications);

    // realtime emit
    for (const id of userIds) {
      emitToUser(id.toString(), "notification", payload);
    }
  } catch (err) {
    console.error("notifyMany error:", err);
  }
};