const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationRoomSchema = new Schema(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    comments: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const ConversationRoom = mongoose.model(
  "ConversationRoom",
  conversationRoomSchema
);
module.exports = ConversationRoom;
