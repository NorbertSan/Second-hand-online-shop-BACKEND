const router = require("express").Router();
const Cloth = require("../models/cloth.model");

router.route("/").get(async (req, res) => {
  try {
    const clothes = await Cloth.find()
      .sort({ createdAt: "desc" })
      .limit(10)
      .sort({ dete: "desc" });
    return res.status(200).json(clothes);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

router.route("/add").get(async (req, res) => {
  try {
    const { brand, size, condition, price, description, seller } = req.body;
    Cloth.save;
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
