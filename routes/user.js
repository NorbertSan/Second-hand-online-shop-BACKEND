const router = require("express").Router();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utils/auth");

// LOGIN
router.route("/login").post(async (req, res) => {
  const { email, password, remember } = req.body;
  try {
    const userWithSameEmail = await User.findOne({ email });
    if (!userWithSameEmail)
      return res
        .status(404)
        .json({ general: "User with that email does not exist" });
    const auth = await bcrypt.compare(password, userWithSameEmail.password);
    if (!auth) return res.status(404).json({ general: "Wrong credentials" });

    const dataToToken = {
      fullName: userWithSameEmail.fullName,
      nickName: userWithSameEmail.nickName,
      email: userWithSameEmail.email,
    };
    const accessToken = jwt.sign(dataToToken, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "3min",
    });

    const refreshToken = jwt.sign(
      { ...userWithSameEmail },
      process.env.ACCESS_TOKEN_SECRET
    );
    if (remember) await User.findOneAndUpdate({ email }, { refreshToken });

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// SIGN UP
router.route("/signup").post(async (req, res) => {
  const { fullName, nickName, email, location, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      fullName,
      nickName,
      email,
      location,
      password: hashedPassword,
    };
    const newUser = new User(userData);
    const addedUser = await newUser.save();
    return res.status(201).json(addedUser);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// LOGOUT
router.route("/logout").post(authenticateToken, async (req, res) => {
  const { email } = req.user;
  try {
    await User.findOneAndUpdate({ email }, { refreshToken: null });
    return res.status(200).json({ message: "Refresh token deleted" });
  } catch (err) {
    console.log(error);
    return res.status(500).json(err);
  }
});

module.exports = router;
