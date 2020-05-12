const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    brand: String,
    size: String,
    price: Number,
    description: String,
    condition: String,
    type: String,
    sold: {
      type: Boolean,
      default: false,
    },
    writer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
