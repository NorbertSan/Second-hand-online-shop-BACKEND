const router = require("express").Router();
const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth");

// GET NOTIFICATIONS
router.route("/").post(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  const { skip, limit } = req.body;
  try {
    const { notifications: notificationsIds } = await User.findById(_id);
    const notifications = await Notification.find()
      .where("_id")
      .in(notificationsIds)
      .populate("author", { avatar: 1, nickName: 1 })
      .populate("recipient", { avatar: 1, nickName: 1 })
      .sort({ createdAt: -1 })
      .skip(skip * limit)
      .limit(limit);
    return res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// CLEAR USER NUMBER OF UNREAD NOTIFICATIONS
router.route("/clear_unread").put(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    await User.findByIdAndUpdate(_id, { unreadNotificationsNumber: 0 });
    return res.status(200).json({ general: "Unread notifications clear" });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// MARK NOTIFICATION READ
router.route("/read").put(authenticateToken, async (req, res) => {
  const { notification_id } = req.body;
  try {
    const notification = await Notification.findByIdAndUpdate(notification_id, {
      read: true,
    });
    return res.status(200).json(notification);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
