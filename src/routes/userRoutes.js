import express from "express";
import {
  getUserProfile,
  updateProfile,
  toggleFollow,
  searchUsers,
  getSuggestions,
  getFollowList,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Barcha route'lar himoyalangan
router.use(protect);

router.get("/", searchUsers); // ?search=...
router.get("/suggestions", getSuggestions);
router.put("/profile", upload.single("avatar"), updateProfile);

router.get("/:id/followers", getFollowList);
router.get("/:id/following", getFollowList);
router.post("/:id/follow", toggleFollow);

// Eng oxirida — username bo'yicha (boshqa route'larni ushlab qolmasligi uchun)
router.get("/:username", getUserProfile);

export default router;
