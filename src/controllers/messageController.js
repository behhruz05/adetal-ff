import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { emitToUser } from "../socket/index.js";

// @desc    Suhbatni ochish yoki mavjudini olish
// @route   POST /api/messages/conversations
// @access  Private
// body: { userId } — kim bilan suhbatlashish
export const accessConversation = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId majburiy" });
    }

    // Ikki ishtirokchili suhbat allaqachon bor-yo'qligini tekshirish
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
    })
      .populate("participants", "username fullName avatar")
      .populate("lastMessage");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });
      conversation = await conversation.populate(
        "participants",
        "username fullName avatar"
      );
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mening barcha suhbatlarim
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "username fullName avatar")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "username" },
      });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Suhbatdagi xabarlar
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Ishtirokchimi tekshirish
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Suhbat topilmadi" });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate("sender", "username avatar");

    // Boshqalardan kelgan o'qilmaganlarni o'qilgan deb belgilash
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        isRead: false,
      },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Xabar yuborish
// @route   POST /api/messages/:conversationId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text = "" } = req.body;

    const media = req.file ? `/uploads/${req.file.filename}` : "";
    if (!text.trim() && !media) {
      return res.status(400).json({ message: "Xabar bo'sh bo'lmasligi kerak" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Suhbat topilmadi" });
    }
    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Ruxsat yo'q" });
    }

    let message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      text: text.trim(),
      media,
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    message = await message.populate("sender", "username avatar");

    // Qabul qiluvchi(lar)ga real-time yuborish
    conversation.participants.forEach((participantId) => {
      if (participantId.toString() !== req.user._id.toString()) {
        emitToUser(participantId, "newMessage", message);
      }
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    O'qilmagan xabarlar soni
// @route   GET /api/messages/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    }).select("_id");
    const ids = conversations.map((c) => c._id);

    const count = await Message.countDocuments({
      conversation: { $in: ids },
      sender: { $ne: req.user._id },
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
