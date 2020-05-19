const router = require("express").Router();
const Product = require("../models/product.model");
const User = require("../models/user.model");

const { authenticateToken } = require("../middleware/auth");

// ADD PRODUCT
router.route("/add").post(authenticateToken, async (req, res) => {
  const { email } = req.user;
  try {
    const newProduct = new Product(req.body);
    const addedProduct = await newProduct.save();
    const user = await User.findOne({ email });
    await User.findOneAndUpdate(
      { email },
      { products: [...user.products, addedProduct._id] }
    );

    return res.status(201).json(addedProduct);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET PRODUCTS
router.route("/").post(async (req, res) => {
  const page = parseInt(req.body.page);
  const limit = parseInt(req.body.limit);
  const findArs = {};
  Object.keys(req.body).map((category) => {
    if (category !== "limit" && category !== "page" && category !== "") {
      findArs[category] = req.body[category];
    }
  });
  try {
    const productsAmount = await Product.count(findArs);
    const pages = Math.ceil(productsAmount / limit);
    const products = await Product.find(findArs)
      .populate("writer", {
        nickName: 1,
        createdAt: 1,
        lastLogin: 1,
        avatar: 1,
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.status(200).json({ products, pages });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET SINGLE PRODUCT
router.route("/singleProduct/:product_id").get(async (req, res) => {
  const { product_id } = req.params;
  try {
    const product = await Product.findById(product_id).populate("writer", {
      avatar: 1,
      nickName: 1,
      createdAt: 1,
      lastLogin: 1,
      location: 1,
      products: 1,
    });
    // INCREASE VIEW
    await Product.findByIdAndUpdate(product_id, { views: product.views + 1 });
    return res.status(200).json(product);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// TOGGLE ADD TO FAV
router.route("/:product_id/like").get(authenticateToken, async (req, res) => {
  const { email } = req.user;
  const { product_id } = req.params;
  try {
    const user = await User.findOne({ email });
    const product = await Product.findById(product_id);
    let like;
    let newLikesCount = product.likes;
    let newLikesProducts = [...user.likesProducts];
    if (newLikesProducts.includes(product_id)) {
      // REMOVE
      newLikesCount--;
      newLikesProducts = newLikesProducts.filter((item) => item !== product_id);
      like = false;
    } else {
      // ADD
      newLikesCount++;
      newLikesProducts.push(product_id);
      like = true;
    }
    await Product.findByIdAndUpdate(product_id, { likes: newLikesCount });
    await User.findOneAndUpdate(
      { email },
      {
        likesProducts: newLikesProducts,
      }
    );
    return res.status(200).json({ productsIdsList: newLikesProducts, like });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET PRODUCTS BASED ON ARRAY OF IDS
router.route("/products/Ids").post(async (req, res) => {
  const { productsIds, limit, page } = req.body;
  try {
    const products = await Product.find()
      .where("_id")
      .in(productsIds)
      .populate("writer", { avatar: 1, lastLogin: 1, nickName: 1 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET ALL UNIQUE BRANDS
router.route("/brands").get(async (req, res) => {
  try {
    const brands = await Product.distinct("brand");
    const uniqueBrands = brands.filter(
      (brand, index, arr) => arr.indexOf(brand) === index
    );
    return res.status(200).json(uniqueBrands);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
