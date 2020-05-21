const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    type: String, // 'like' || 'comment'
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
