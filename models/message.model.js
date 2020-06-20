const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    body: String,
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    writer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    images: {
      type: Array,
      default: [],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    reacts: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
