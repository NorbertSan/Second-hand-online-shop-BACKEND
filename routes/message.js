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
      $or: [
        { user1: _id, user2: recipient._id },
        { user1: recipient._id, user2: _id },
      ],
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
    const newMessagesIds = [addedMessage._id, ...conversationRoom.messages];
    await ConversationRoom.findByIdAndUpdate(conversationRoom._id, {
      messages: newMessagesIds,
    });
    const addedMessageWithUserInfo = await Message.findById(addedMessage._id)
      .populate("writer", {
        nickName: 1,
        avatar: 1,
      })
      .populate("recipient", {
        nickName: 1,
        avatar: 1,
      });
    return res.status(200).json(addedMessageWithUserInfo);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET CONVERSATION ROOMS OVERVIEW WITH ONE LATEST MESSAGE
router.route("/rooms").get(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    const conversationRoomsList = await ConversationRoom.find({
      $or: [{ user1: [_id] }, { user2: [_id] }],
    });
    // GET LATEST MESSAGE FROM EVERY ROOM
    let messagesIds = [];
    conversationRoomsList.forEach((room) => messagesIds.push(room.messages[0]));
    const messages = await Message.find()
      .where("_id")
      .in(messagesIds)
      .populate("writer", { avatar: 1, nickName: 1 })
      .populate("recipient", { avatar: 1, nickName: 1 })
      .sort({ createdAt: -1 });

    return res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// GET ALL MESSAGES FROM ONE ROOM
router.route("/room/:nickName").get(authenticateToken, async (req, res) => {
  const { nickName } = req.params;
  const { _id } = req.user;
  try {
    const { _id: interlocutor_id } = await User.findOne({ nickName });
    const { messages: messagesId } = await ConversationRoom.findOne({
      $or: [
        { user1: _id, user2: interlocutor_id },
        { user1: interlocutor_id, user2: _id },
      ],
    });
    const messages = await Message.find()
      .where("_id")
      .in(messagesId)
      .populate("writer", { avatar: 1, nickName: 1 })
      .sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
