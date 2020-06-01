const router = require("express").Router();
const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Notification = require("../models/notification.model");
const { authenticateToken } = require("../middleware/auth");

// CREATE ORDER
router.route("/").post(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  const { addressData, paymentData, recipientData, product_id } = req.body;
  try {
    // CREATE PAYMENT
    const newPayment = new Payment({
      addressData,
      paymentData,
      recipientData,
      product: product_id,
    });
    const addedPayment = await newPayment.save();
    // MARK BOUGHT PRODUCT AS SOLD
    const product = await Product.findByIdAndUpdate(product_id, {
      sold: true,
    });
    // CREATE SELL NOTIFICATION
    const newNotification = new Notification({
      type: "sell",
      author: _id,
      recipient: product.writer,
      product: product_id,
    });
    const addedNotification = await newNotification.save();
    // ADD NOTIFICATION TO RECIPIENT USER
    const recipient = await User.findById(product.writer);
    await User.findByIdAndUpdate(product.writer, {
      unreadNotificationsNumber: recipient.unreadNotificationsNumber + 1,
      notifications: [addedNotification._id, ...recipient.notifications],
    });
    // ADD PAYMENT_ID LOGGED USER
    const user = await User.findById(_id);
    await User.findByIdAndUpdate(_id, {
      payments: [addedPayment._id, ...user.payments],
    });
    return res
      .status(200)
      .json("Payment created, notification created, product sold");
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET ALL USER ORDERS
router.route("/").get(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    const { payments } = await User.findById(_id);
    const purchases = await Payment.find()
      .where("_id")
      .in(payments)
      .populate({
        path: "product",
        populate: {
          path: "writer",
        },
      });
    return res.status(200).json(purchases);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET ALL USER SALES
router.route("/sales").get(authenticateToken, async (req, res) => {
  const { _id } = req.user;
  try {
    const { products } = await User.findById(_id);
    const payments = await Payment.find()
      .where("product")
      .in(products)
      .sort({ createdAt: -1 })
      .populate("product");
    return res.status(200).json(payments);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
