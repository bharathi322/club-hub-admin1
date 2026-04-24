import Notification from "../models/Notification.js";
import { emitToUser } from "../socketManager.js";

// CREATE SINGLE NOTIFICATION
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

    // realtime emit
    if (userId) {
      emitToUser(userId.toString(), "notification", {
        title,
        description: message,
        type,
      });
    }

    return notification;
  } catch (err) {
    console.error("createNotification error:", err);
    return null;
  }
};

// NOTIFY MULTIPLE USERS
export const notifyMany = async (userIds = [], payload = {}) => {
  try {
    if (!userIds.length) return;

    const notifications = userIds.map((id) => ({
      user: id,
      title: payload.title || "Notification",
      description: payload.message || payload.description || "",
      type: payload.type || "info",
      relatedEvent: payload.relatedEvent || null,
    }));

    await Notification.insertMany(notifications);

    // realtime emit
    for (const id of userIds) {
      emitToUser(id.toString(), "notification", {
        title: payload.title,
        description: payload.message || payload.description,
        type: payload.type || "info",
      });
    }
  } catch (err) {
    console.error("notifyMany error:", err);
  }
};
