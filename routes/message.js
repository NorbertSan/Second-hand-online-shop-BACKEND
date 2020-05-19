const router = require("express").Router();
const Message = require("../models/message.model");
const ConversationRoom = require("../models/conversationRoom.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth");

// ADD MESSAGE
router.route("/add").post(authenticateToken, async (req, res) => {
  const { recipient: recipientNickName, body } = req.body;
  const { _id } = req.user;
  try {
    // find conversation room
    const recipient = await User.findOne({ nickName: recipientNickName });
    let conversationRoom = await ConversationRoom.findOne({
      $or: [{ user1: [_id, recipient._id] }, { user2: [_id, recipient._id] }],
    });
    // if not exist, create one
    if (!conversationRoom) {
      const newConversationRoom = new ConversationRoom({
        user1: _id,
        user2: recipient._id,
      });
      conversationRoom = await newConversationRoom.save();
    }
    // create message doc
    const newMessage = new Message({
      body,
      writer: _id,
      recipient: recipient._id,
    });
    const addedMessage = await newMessage.save();
    // push message id to room conversation
    const newCommentsIds = [...conversationRoom.comments, addedMessage._id];
    await ConversationRoom.findByIdAndUpdate(conversationRoom._id, {
      comments: newCommentsIds,
    });
    const addedMessageWithUserInfo = await Message.findById(addedMessage._id)
      .populate("recipient", {
        nickName: 1,
        avatar: 1,
      })
      .populate("writer", {
        nickName: 1,
        avatar: 1,
      });
    return res.status(200).json(addedMessageWithUserInfo);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
