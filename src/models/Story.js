import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      url: { type: String, required: true },
      type: { type: String, enum: ["image", "video"], default: "image" },
    },
    caption: {
      type: String,
      default: "",
    },
    // Story'ni ko'rgan foydalanuvchilar
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // 24 soatdan keyin avtomatik o'chadi (TTL index)
    expiresAt: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
    },
  },
  { timestamps: true }
);

// TTL index — expiresAt vaqti yetganda hujjat avtomatik o'chiriladi
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model("Story", storySchema);
export default Story;
