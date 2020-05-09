const router = require("express").Router();
const Product = require("../models/product.model");
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");

router.route("/").get(async (req, res) => {
  try {
    const products = await Cloth.find()
      .sort({ createdAt: "desc" })
      .limit(10)
      .sort({ dete: "desc" });
    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// UPLOAD IMAGE
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== ".jpg" || ext !== ".png") {
      return cb(res.status(400).end("only jpg, png are allowed"), false);
    }
    cb(null, true);
  },
});
const upload = multer({ storage }).single("file");

router.route("/uploadImage").post(async (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.json({ success: false, err });
    }
    return res.json({
      success: true,
      image: res.req.file.path,
      fileName: res.req.file.filename,
    });
  });
});

// ADD PRODUCT
router.route("/add").post(authenticateToken, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const addedProduct = await newProduct.save();
    return res.status(201).json(addedProduct);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
module.exports = router;
