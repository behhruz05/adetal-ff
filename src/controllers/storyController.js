import Story from "../models/Story.js";
import User from "../models/User.js";

// @desc    Story yaratish
// @route   POST /api/stories
// @access  Private
export const createStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Rasm yoki video yuklang" });
    }

    const story = await Story.create({
      author: req.user._id,
      media: {
        url: `/uploads/${req.file.filename}`,
        type: req.file.mimetype.startsWith("video") ? "video" : "image",
      },
      caption: req.body.caption || "",
    });

    const populated = await story.populate("author", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Feed storylari — o'zim + follow qilganlarim, foydalanuvchi bo'yicha guruhlangan
// @route   GET /api/stories/feed
// @access  Private
export const getStoriesFeed = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const authors = [...me.following, me._id];

    const stories = await Story.find({ author: { $in: authors } })
      .sort({ createdAt: 1 })
      .populate("author", "username avatar");

    // Foydalanuvchi bo'yicha guruhlash
    const grouped = {};
    for (const story of stories) {
      const uid = story.author._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          author: story.author,
          stories: [],
          hasUnseen: false,
        };
      }
      const seen = story.viewers.some(
        (v) => v.toString() === req.user._id.toString()
      );
      grouped[uid].stories.push({
        ...story.toObject(),
        seen,
      });
      if (!seen) grouped[uid].hasUnseen = true;
    }

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Foydalanuvchining storylari
// @route   GET /api/stories/user/:userId
// @access  Private
export const getUserStories = async (req, res) => {
  try {
    const stories = await Story.find({ author: req.params.userId })
      .sort({ createdAt: 1 })
      .populate("author", "username avatar")
      .populate("viewers", "username avatar");
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Story'ni ko'rilgan deb belgilash
// @route   POST /api/stories/:id/view
// @access  Private
export const viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story topilmadi" });
    }

    const alreadyViewed = story.viewers.some(
      (v) => v.toString() === req.user._id.toString()
    );
    if (!alreadyViewed) {
      story.viewers.push(req.user._id);
      await story.save();
    }

    res.json({ viewersCount: story.viewers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Story'ni o'chirish
// @route   DELETE /api/stories/:id
// @access  Private (egasi)
export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story topilmadi" });
    }
    if (story.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }
    await story.deleteOne();
    res.json({ message: "Story o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
