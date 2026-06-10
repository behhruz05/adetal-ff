import express from "express";
import {
  accessConversation,
  getConversations,
  getMessages,
  sendMessage,
  getUnreadCount,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/conversations", accessConversation);
router.get("/conversations", getConversations);
router.get("/unread/count", getUnreadCount);

router.get("/:conversationId", getMessages);
router.post("/:conversationId", upload.single("media"), sendMessage);

export default router;
