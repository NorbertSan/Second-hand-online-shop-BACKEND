const router = require("express").Router();
const User = require("../models/user.model");
const Product = require("../models/product.model");
const Comment = require("../models/comment.model");
const ConversationRoom = require("../models/conversationRoom.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth");

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
      _id: userWithSameEmail._id,
    };

    const refreshToken = jwt.sign(dataToToken, process.env.ACCESS_TOKEN_SECRET);

    if (remember) {
      await User.findOneAndUpdate({ email }, { refreshToken });
      dataToToken.refreshToken = refreshToken;
    } else await User.findOneAndUpdate({ email }, { refreshToken: null });

    const accessToken = jwt.sign(dataToToken, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30min",
    });

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
    if (err.code === 11000) {
      const keyPattern = Object.keys(err.keyPattern)[0];
      return res
        .status(400)
        .json({ general: `Provided ${keyPattern} is taken` });
    }
    return res.status(500).json(err);
  }
});

// LOGOUT
router.route("/logout").post(async (req, res) => {
  const { email } = req.body.email;
  try {
    await User.findOneAndUpdate({ email }, { refreshToken: null });
    return res.status(200).json({ message: "Refresh token deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET LOGGED USER DATA
router.route("/").get(authenticateToken, async (req, res) => {
  const { email } = req.user;
  try {
    const user = await User.findOne(
      { email },
      {
        fullName: 1,
        nickName: 1,
        email: 1,
        location: 1,
        bio: 1,
        likesProducts: 1,
        products: 1,
        comments: 1,
        avatar: 1,
        lastLogin: 1,
        unreadMessages: 1,
      }
    ).populate("products");
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// CREATE REFRESH TOKEN
router.route("/token").post(async (req, res) => {
  const decodedToken = req.body.decodedToken;
  const email = decodedToken.email;
  const refreshTokenLocalStorage = decodedToken.refreshToken;
  try {
    const userWithThatEmail = await User.findOne({ email });
    if (refreshTokenLocalStorage === userWithThatEmail.refreshToken) {
      // create new token
      const newToken = jwt.sign(
        {
          fullName: decodedToken.fullName,
          email: decodedToken.email,
          nickName: decodedToken.nickName,
          refreshToken: decodedToken.refreshToken,
          _id: decodedToken._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "30min",
        }
      );
      return res.status(200).json({ newToken });
    } else {
      // LOGOUT
      await User.findOneAndUpdate({ email }, { refreshToken: null });
      return res.status(401).json({ error: "It is not your token,logout" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// GET USER DATA
router.route("/:nickName").get(async (req, res) => {
  const { nickName } = req.params;
  try {
    const userData = await User.findOne(
      { nickName },
      {
        fullName: 1,
        nickName: 1,
        email: 1,
        location: 1,
        bio: 1,
        likesProducts: 1,
        products: 1,
        comments: 1,
        avatar: 1,
        lastLogin: 1,
        createdAt: 1,
      }
    );
    return res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// SEARCH USERS NICKNAME
router.route("/search/:nickName").get(async (req, res) => {
  const { nickName } = req.params;
  try {
    const nickNameList = await User.find(
      { nickName: { $regex: ".*" + nickName + ".*" } },
      { nickName: 1 }
    ).limit(10);
    return res.status(200).json(nickNameList);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// UPDATE USER INFO
router.route("/update_info").post(authenticateToken, async (req, res) => {
  const data = req.body;
  const { email } = req.user;
  try {
    const user = await User.findOneAndUpdate({ email }, data);
    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
// CHANGE PASSWORD
router.route("/password").post(authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { email } = req.user;
  try {
    const { password: presentPassword } = await User.findOne({ email });
    const auth = await bcrypt.compare(oldPassword, presentPassword);
    if (auth) {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ email }, { password: newHashedPassword });
      return res
        .status(200)
        .json({ password: "Password changed successfully" });
    } else {
      return res.status(403).json({ password: "Old password does not match" });
    }
  } catch (err) {
    console.error(err);
  }
});
// DELETE ACCOUNT
router.route("/account").post(authenticateToken, async (req, res) => {
  const { password } = req.body;
  const { email } = req.user;
  try {
    const user = await User.findOne({ email });
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      // DELETE ALL RELATED COMMENTS && PRODUCTS
      const productsIds = user.products;
      const commentsIds = user.comments;

      await Product.deleteMany({
        _id: { $in: productsIds },
      });
      await Product.deleteMany({
        writer: { $in: user._id },
      });
      await Comment.deleteMany({
        _id: { $in: commentsIds },
      });
      await Comment.deleteMany({
        writer: { $in: user._id },
      });

      await User.findOneAndDelete({ email });
      return res.status(200).json({ general: "Account deleted" });
    } else return res.status(403).json({ password: "Wrong password" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
