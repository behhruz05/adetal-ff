import express from "express";
import {
  createPost,
  getFeed,
  getExplore,
  getPost,
  getUserPosts,
  toggleLike,
  toggleSave,
  getSavedPosts,
  deletePost,
  getPostsByHashtag,
} from "../controllers/postController.js";
import { addComment, getComments } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.use(protect);

// Maxsus route'lar (parametrlardan oldin)
router.get("/feed", getFeed);
router.get("/explore", getExplore);
router.get("/saved", getSavedPosts);
router.get("/hashtag/:tag", getPostsByHashtag);
router.get("/user/:userId", getUserPosts);

// Post yaratish — bir nechta media (carousel) qabul qiladi
router.post("/", upload.array("media", 10), createPost);

// Komment route'lari (postga nested)
router.post("/:postId/comments", addComment);
router.get("/:postId/comments", getComments);

router.post("/:id/like", toggleLike);
router.post("/:id/save", toggleSave);

router.get("/:id", getPost);
router.delete("/:id", deletePost);

export default router;
