const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema(
  {
    paymentData: {
      type: Object,
      default: {},
    },
    recipientData: {
      type: Object,
      default: {},
    },
    addressData: {
      type: Object,
      default: {},
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;
