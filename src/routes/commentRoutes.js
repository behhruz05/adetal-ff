import express from "express";
import {
  toggleCommentLike,
  deleteComment,
} from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/:id/like", toggleCommentLike);
router.delete("/:id", deleteComment);

export default router;
