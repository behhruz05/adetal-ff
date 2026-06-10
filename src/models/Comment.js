import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "Komment matni majburiy"],
      trim: true,
      maxlength: [1000, "Komment 1000 ta belgidan oshmasligi kerak"],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Javob kommentlar (reply) uchun
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
