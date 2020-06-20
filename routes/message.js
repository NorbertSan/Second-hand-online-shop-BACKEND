const router = require("express").Router();
const Message = require("../models/message.model");
const ConversationRoom = require("../models/conversationRoom.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth");

// ADD MESSAGE
router.route("/add").post(authenticateToken, async (req, res) => {
  const { recipient: recipientNickName, body, images } = req.body;
  const { _id } = req.user;
  try {
    const recipient = await User.findOne({ nickName: recipientNickName });
    // find conversation room
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
      images,
    });
    const addedMessage = await newMessage.save();
    // push message id to room conversation
    const newMessagesIds = [addedMessage._id, ...conversationRoom.messages];
    await ConversationRoom.findByIdAndUpdate(conversationRoom._id, {
      messages: newMessagesIds,
      read: false,
    });
    // push message id to recipient unReadMessages array
    const newUnreadMessages = [addedMessage._id, ...recipient.unreadMessages];
    await User.findByIdAndUpdate(recipient._id, {
      unreadMessages: newUnreadMessages,
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
    const { blockedUsers } = await User.findById(_id);
    const conversationRoomsList = await ConversationRoom.find({
      $or: [{ user1: [_id] }, { user2: [_id] }],
      user1: { $nin: blockedUsers },
      user2: { $nin: blockedUsers },
    });
    // GET LATEST MESSAGE FROM EVERY ROOM
    let messagesIds = [];
    conversationRoomsList.forEach((room) => messagesIds.push(room.messages[0]));
    const messages = await Message.find()
      .where("_id")
      .in(messagesIds)
      .populate("writer", { avatar: 1, nickName: 1, lastLogin: 1 })
      .populate("recipient", { avatar: 1, nickName: 1, lastLogin: 1 })
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
    const { blockedUsers } = await User.findById(_id);
    const { _id: interlocutor_id } = await User.findOne({ nickName });
    if (blockedUsers.includes(interlocutor_id))
      return res.status(404).json({ error: "User is blocked" });
    const conversationRoom = await ConversationRoom.findOne({
      $or: [
        { user1: _id, user2: interlocutor_id },
        { user1: interlocutor_id, user2: _id },
      ],
    });
    if (!conversationRoom) return res.status(200).json([]);
    const { messages: messagesId } = conversationRoom;
    const messages = await Message.find()
      .where("_id")
      .in(messagesId)
      .populate("writer", { avatar: 1, nickName: 1, lastLogin: 1 })
      .sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// MARK MESSAGES READ
router.route("/read").post(authenticateToken, async (req, res) => {
  const { nickName } = req.body;
  const { _id } = req.user;
  try {
    const { unreadMessages } = await User.findById(_id);
    const relatedUnreadMessages = (
      await Message.find()
        .where("_id")
        .in(unreadMessages)
        .populate("writer", { nickName: 1 })
    )
      .filter((message) => message.writer.nickName === nickName)
      .map((item) => item._id.toString());

    const newUnreadMessages = unreadMessages.filter(
      (unreadMessId) => !relatedUnreadMessages.includes(unreadMessId.toString())
    );
    await User.findByIdAndUpdate(_id, { unreadMessages: newUnreadMessages });

    return res.status(200).json(newUnreadMessages);
    return;
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// DELETE MESSAGE
router.route("/:message_id").delete(authenticateToken, async (req, res) => {
  const { message_id } = req.params;
  const { _id } = req.user;
  try {
    const message = await Message.findOneAndUpdate(
      { _id: message_id, writer: _id },
      { deleted: true }
    );
    return res.status(200).json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// REACT MESSAGE
router.route("/:message_id/react").put(authenticateToken, async (req, res) => {
  const { message_id } = req.params;
  const { emojiIndex } = req.body;
  const { _id } = req.user;
  try {
    const { reacts } = await Message.findById(message_id);
    const refreshReacts = reacts.filter((reactObj) => reactObj.author !== _id);
    refreshReacts.push({ author: _id, emojiIndex });
    const message = await Message.findByIdAndUpdate(message_id, {
      reacts: refreshReacts,
    });
    return res.status(200).json({ ...message, reacts: refreshReacts });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
