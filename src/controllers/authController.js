import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc    Ro'yxatdan o'tish
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    if (!username || !fullName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Barcha maydonlarni to'ldiring" });
    }

    // Mavjudligini tekshirish
    const exists = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Bu email yoki username allaqachon band" });
    }

    const user = await User.create({ username, fullName, email, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Tizimga kirish
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    // identifier — email yoki username bo'lishi mumkin
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Email/username va parolni kiriting" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res
        .status(401)
        .json({ message: "Email/username yoki parol noto'g'ri" });
    }

    res.json({
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Joriy foydalanuvchi ma'lumotlari
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username fullName avatar")
      .populate("following", "username fullName avatar");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
