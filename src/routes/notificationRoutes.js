import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread/count", getUnreadCount);
router.put("/read", markAllRead);
router.delete("/:id", deleteNotification);

export default router;
