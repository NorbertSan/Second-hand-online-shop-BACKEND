const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clothSchema = new Schema(
  {
    brand: String,
    size: String,
    condition: String,
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    price: Number,
    description: String,
    // images: [{ asf: Image }],
    sold: Boolean,
    seller: {
      nickName: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Cloth = mongoose.model("Cloth", clothSchema);
module.exports = Cloth;
