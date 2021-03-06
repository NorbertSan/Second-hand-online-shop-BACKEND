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
    messages: {
      type: Array,
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
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
