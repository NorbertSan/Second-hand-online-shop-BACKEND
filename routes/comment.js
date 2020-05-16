const router = require("express").Router();
const Comment = require("../models/comment.model");
const User = require("../models/user.model");
const { authenticateToken } = require("../middleware/auth");

const findCommonItem = (arr1, arr2) => {
  let common;
  for (let i = 0; i < arr1.length; ++i)
    for (let j = 0; j < arr2.length; ++j)
      if (arr1[i].toString() == arr2[j]) common = arr1[i];
  return common.toString();
};

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
  const { body, stars, nickName, replace } = req.body;
  const { email } = req.user;
  try {
    const userWriter = await User.findOne({ email });
    const newComment = new Comment({ body, stars, writer: userWriter._id });
    const addedComment = await newComment.save();
    const userRecipient = await User.findOne({ nickName });
    let newCommentsIds = [...userRecipient.comments];
    let commonCommentId;
    if (replace) {
      const userWriterComments = await Comment.find({ writer: userWriter._id });
      const userWriterCommentsIds = userWriterComments.map(
        (comment) => comment._id
      );
      commonCommentId = findCommonItem(
        userWriterCommentsIds,
        userRecipient.comments
      );

      newCommentsIds = newCommentsIds.filter(
        (commentId) => commentId != commonCommentId
      );
      await Comment.findByIdAndDelete(commonCommentId);
    }
    await User.findOneAndUpdate(
      { nickName },
      { comments: [...newCommentsIds, addedComment._id] }
    );

    const addedCommentWithUserPopulate = await Comment.findById(
      addedComment._id
    ).populate("writer");
    return res.status(201).json({
      comment: addedCommentWithUserPopulate,
      commentIdToDelete: commonCommentId || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

// REMOVE COMMENT
router
  .route("/:comment_id/:nickName")
  .delete(authenticateToken, async (req, res) => {
    const { comment_id, nickName } = req.params;
    const { email } = req.user;
    try {
      await Comment.findByIdAndDelete(comment_id);
      const { _id, comments } = await User.findOne({ nickName });
      const newCommentsIds = comments.filter(
        (commentId) => commentId != comment_id
      );
      await User.findByIdAndUpdate(_id, {
        comments: newCommentsIds,
      });
      return res.status(200).json(comment_id);
    } catch (err) {
      console.error(err);
      return res.status(500).json(err);
    }
  });

// EDIT COMMENT
router.route("/:comment_id").put(authenticateToken, async (req, res) => {
  const { comment_id } = req.params;
  try {
    await Comment.findByIdAndUpdate(comment_id, {
      ...req.body,
    });
    const editComment = await Comment.findById(comment_id).populate("writer");
    return res.status(200).json(editComment);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});

module.exports = router;
