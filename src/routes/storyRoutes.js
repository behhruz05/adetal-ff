import express from "express";
import {
  createStory,
  getStoriesFeed,
  getUserStories,
  viewStory,
  deleteStory,
} from "../controllers/storyController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

router.post("/", upload.single("media"), createStory);
router.get("/feed", getStoriesFeed);
router.get("/user/:userId", getUserStories);
router.post("/:id/view", viewStory);
router.delete("/:id", deleteStory);

export default router;
