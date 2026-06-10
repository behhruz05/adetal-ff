import Notification from "../models/Notification.js";
import { emitToUser } from "../socket/index.js";

// Bildirishnoma yaratish + real-time yuborish
// O'ziga o'zi notification yubormaslik uchun recipient === sender bo'lsa o'tkazib yuboradi
export const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
  text = "",
}) => {
  try {
    if (recipient.toString() === sender.toString()) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      post,
      comment,
      text,
    });

    const populated = await notification.populate(
      "sender",
      "username fullName avatar"
    );

    // Real-time yuborish
    emitToUser(recipient, "notification", populated);

    return populated;
  } catch (error) {
    console.error("Notification yaratishda xato:", error.message);
    return null;
  }
};
