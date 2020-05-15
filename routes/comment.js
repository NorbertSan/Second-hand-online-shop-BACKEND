const router = require("express").Router();
const Comment = require("../models/comment.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth");

// GET COMMENTS BASED ON NICKNAME
router.route("/user/:nickName").get(async (req, res) => {
  const { nickName } = req.params;
  try {
    const { comments: commentsIds } = await User.findOne({ nickName });
    const comments = await Comment.find()
      .where("_id")
      .in(commentsIds)
      .populate("writer")
      .sort({ createdAt: -1 });
    return res.status(200).json(comments);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// ADD COMMENT
router.route("/").post(authenticateToken, async (req, res) => {
  const { body, stars, nickName } = req.body;
  const { email } = req.user;
  try {
    const userWriter = await User.findOne({ email });
    const newComment = new Comment({ body, stars, writer: userWriter._id });
    const addedComment = await newComment.save();
    const user = await User.findOne({ nickName });
    await User.findOneAndUpdate(
      { nickName },
      { comments: [...user.comments, addedComment._id] }
    );
    const addedCommentWithUserPopulate = await Comment.findById(
      addedComment._id
    ).populate("writer");
    return res.status(200).json(addedCommentWithUserPopulate);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// REMOVE COMMENT
router.route("/:comment_id").delete(async (req, res) => {
  const { comment_id } = req.params;
  try {
    await Comment.findByIdAndDelete(comment_id);
    return res.status(200).json(comment_id);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
