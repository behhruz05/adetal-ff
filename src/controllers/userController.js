import User from "../models/User.js";
import Post from "../models/Post.js";
import { createNotification } from "../utils/notify.js";

// @desc    Profilni username bo'yicha olish
// @route   GET /api/users/:username
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() })
      .populate("followers", "username fullName avatar")
      .populate("following", "username fullName avatar");

    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    const postCount = await Post.countDocuments({ author: user._id });
    const isFollowing = user.followers.some(
      (f) => f._id.toString() === req.user._id.toString()
    );

    res.json({
      ...user.toObject(),
      postCount,
      isFollowing,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Profilni yangilash
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { fullName, bio, website, gender, isPrivate, username } = req.body;

    // Username o'zgartirilsa — band emasligini tekshirish
    if (username && username.toLowerCase() !== user.username) {
      const taken = await User.findOne({ username: username.toLowerCase() });
      if (taken) {
        return res.status(400).json({ message: "Bu username band" });
      }
      user.username = username.toLowerCase();
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (gender !== undefined) user.gender = gender;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    // Avatar yuklangan bo'lsa
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      username: updated.username,
      fullName: updated.fullName,
      email: updated.email,
      avatar: updated.avatar,
      bio: updated.bio,
      website: updated.website,
      gender: updated.gender,
      isPrivate: updated.isPrivate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow / Unfollow
// @route   POST /api/users/:id/follow
// @access  Private
export const toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user._id;

    if (targetId === myId.toString()) {
      return res
        .status(400)
        .json({ message: "O'zingizni follow qila olmaysiz" });
    }

    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }

    const me = await User.findById(myId);
    const isFollowing = me.following.some((id) => id.toString() === targetId);

    if (isFollowing) {
      // Unfollow
      me.following = me.following.filter((id) => id.toString() !== targetId);
      target.followers = target.followers.filter(
        (id) => id.toString() !== myId.toString()
      );
    } else {
      // Follow
      me.following.push(targetId);
      target.followers.push(myId);
    }

    await me.save();
    await target.save();

    if (!isFollowing) {
      await createNotification({
        recipient: targetId,
        sender: myId,
        type: "follow",
        text: "sizni kuzatishni boshladi",
      });
    }

    res.json({
      following: !isFollowing,
      followersCount: target.followers.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Foydalanuvchilarni qidirish
// @route   GET /api/users?search=...
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search) return res.json([]);

    const users = await User.find({
      $or: [
        { username: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ],
    })
      .select("username fullName avatar")
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Follow uchun tavsiyalar (men follow qilmaganlar)
// @route   GET /api/users/suggestions
// @access  Private
export const getSuggestions = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const exclude = [...me.following, me._id];

    const users = await User.find({ _id: { $nin: exclude } })
      .select("username fullName avatar")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Foydalanuvchi follower/following ro'yxati
// @route   GET /api/users/:id/followers  | /api/users/:id/following
// @access  Private
export const getFollowList = async (req, res) => {
  try {
    const field = req.path.includes("followers") ? "followers" : "following";
    const user = await User.findById(req.params.id).populate(
      field,
      "username fullName avatar"
    );
    if (!user) {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }
    res.json(user[field]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
