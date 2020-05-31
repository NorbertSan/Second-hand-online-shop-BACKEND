const router = require("express").Router();
const Payment = require("../models/payment.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth");

module.exports = router;
