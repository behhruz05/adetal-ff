import Post from "../models/Post.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import { createNotification } from "../utils/notify.js";

// Caption ichidan #hashtag larni ajratib olish
const extractHashtags = (caption = "") => {
  const matches = caption.match(/#[\p{L}0-9_]+/gu) || [];
  return matches.map((t) => t.slice(1).toLowerCase());
};

// @desc    Post yaratish (1 yoki bir nechta media bilan)
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { caption = "", location = "" } = req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "Kamida bitta rasm yoki video yuklang" });
    }

    const media = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith("video") ? "video" : "image",
    }));

    const post = await Post.create({
      author: req.user._id,
      caption,
      location,
      media,
      hashtags: extractHashtags(caption),
    });

    const populated = await post.populate("author", "username fullName avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Feed — o'zim va follow qilganlarimning postlari
// @route   GET /api/posts/feed?page=1&limit=10
// @access  Private
export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const me = await User.findById(req.user._id);
    const authors = [...me.following, me._id];

    const posts = await Post.find({ author: { $in: authors } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "username fullName avatar")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 }, limit: 2 },
        populate: { path: "author", select: "username avatar" },
      });

    const total = await Post.countDocuments({ author: { $in: authors } });

    // Har bir postga foydali maydonlar qo'shish
    const enriched = posts.map((p) => ({
      ...p.toObject(),
      likesCount: p.likes.length,
      commentsCount: p.comments.length,
      isLiked: p.likes.some((id) => id.toString() === req.user._id.toString()),
      isSaved: me.savedPosts.some((id) => id.toString() === p._id.toString()),
    }));

    res.json({
      posts: enriched,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Explore — barcha mashhur postlar
// @route   GET /api/posts/explore
// @access  Private
export const getExplore = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Like soni bo'yicha saralash (oddiy mashhurlik)
    const posts = await Post.aggregate([
      { $addFields: { likesCount: { $size: "$likes" } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    await Post.populate(posts, {
      path: "author",
      select: "username fullName avatar",
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bitta postni olish
// @route   GET /api/posts/:id
// @access  Private
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username fullName avatar")
      .populate("taggedUsers", "username avatar")
      .populate({
        path: "comments",
        options: { sort: { createdAt: -1 } },
        populate: { path: "author", select: "username avatar" },
      });

    if (!post) {
      return res.status(404).json({ message: "Post topilmadi" });
    }

    const me = await User.findById(req.user._id);
    res.json({
      ...post.toObject(),
      likesCount: post.likes.length,
      isLiked: post.likes.some(
        (id) => id.toString() === req.user._id.toString()
      ),
      isSaved: me.savedPosts.some((id) => id.toString() === post._id.toString()),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Foydalanuvchining postlari
// @route   GET /api/posts/user/:userId
// @access  Private
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate("author", "username fullName avatar");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Like / Unlike
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post topilmadi" });
    }

    const userId = req.user._id;
    const isLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
      await createNotification({
        recipient: post.author,
        sender: userId,
        type: "like",
        post: post._id,
        text: "postingizga like bosdi",
      });
    }

    await post.save();
    res.json({ isLiked: !isLiked, likesCount: post.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Saqlash / Saqlashni bekor qilish
// @route   POST /api/posts/:id/save
// @access  Private
export const toggleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post topilmadi" });
    }

    const me = await User.findById(req.user._id);
    const isSaved = me.savedPosts.some(
      (id) => id.toString() === post._id.toString()
    );

    if (isSaved) {
      me.savedPosts = me.savedPosts.filter(
        (id) => id.toString() !== post._id.toString()
      );
    } else {
      me.savedPosts.push(post._id);
    }

    await me.save();
    res.json({ isSaved: !isSaved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Saqlangan postlar
// @route   GET /api/posts/saved
// @access  Private
export const getSavedPosts = async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate({
      path: "savedPosts",
      populate: { path: "author", select: "username fullName avatar" },
    });
    res.json(me.savedPosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Postni o'chirish
// @route   DELETE /api/posts/:id
// @access  Private (faqat egasi)
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post topilmadi" });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Bu postni o'chirishga ruxsatingiz yo'q" });
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: "Post o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hashtag bo'yicha postlar
// @route   GET /api/posts/hashtag/:tag
// @access  Private
export const getPostsByHashtag = async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const posts = await Post.find({ hashtags: tag })
      .sort({ createdAt: -1 })
      .populate("author", "username fullName avatar");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
