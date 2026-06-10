import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import { createNotification } from "../utils/notify.js";

// @desc    Postga komment qo'shish
// @route   POST /api/posts/:postId/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text, parentComment = null } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Komment matnini kiriting" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post topilmadi" });
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
      parentComment,
    });

    post.comments.push(comment._id);
    await post.save();

    await createNotification({
      recipient: post.author,
      sender: req.user._id,
      type: "comment",
      post: post._id,
      comment: comment._id,
      text: "postingizga komment yozdi",
    });

    const populated = await comment.populate("author", "username avatar");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Postning kommentlari
// @route   GET /api/posts/:postId/comments
// @access  Private
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate("author", "username avatar");

    const enriched = comments.map((c) => ({
      ...c.toObject(),
      likesCount: c.likes.length,
      isLiked: c.likes.some((id) => id.toString() === req.user._id.toString()),
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Komment like / unlike
// @route   POST /api/comments/:id/like
// @access  Private
export const toggleCommentLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Komment topilmadi" });
    }

    const userId = req.user._id;
    const isLiked = comment.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (isLiked) {
      comment.likes = comment.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    res.json({ isLiked: !isLiked, likesCount: comment.likes.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Kommentni o'chirish
// @route   DELETE /api/comments/:id
// @access  Private (komment egasi yoki post egasi)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Komment topilmadi" });
    }

    const post = await Post.findById(comment.post);
    const isOwner = comment.author.toString() === req.user._id.toString();
    const isPostOwner =
      post && post.author.toString() === req.user._id.toString();

    if (!isOwner && !isPostOwner) {
      return res
        .status(403)
        .json({ message: "Bu kommentni o'chirishga ruxsatingiz yo'q" });
    }

    if (post) {
      post.comments = post.comments.filter(
        (id) => id.toString() !== comment._id.toString()
      );
      await post.save();
    }

    // Javob kommentlarni ham o'chirish
    await Comment.deleteMany({ parentComment: comment._id });
    await comment.deleteOne();

    res.json({ message: "Komment o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
