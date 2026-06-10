import Notification from "../models/Notification.js";

// @desc    Mening bildirishnomalarim
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username fullName avatar")
      .populate("post", "media")
      .populate("comment", "text");

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    O'qilmagan bildirishnomalar soni
// @route   GET /api/notifications/unread/count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Barchasini o'qilgan deb belgilash
// @route   PUT /api/notifications/read
// @access  Private
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "Barcha bildirishnomalar o'qildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bitta bildirishnomani o'chirish
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });
    if (!notification) {
      return res.status(404).json({ message: "Bildirishnoma topilmadi" });
    }
    await notification.deleteOne();
    res.json({ message: "O'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
