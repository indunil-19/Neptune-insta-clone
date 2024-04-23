const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("Post");

router.get("/allpost", requireLogin, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("postedBy", "_id name")
      .populate("comments.postedBy", "_id name")
      .sort("-createdAt");
    res.json({ posts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getsubpost", requireLogin, async (req, res) => {
  try {
    const posts = await Post.find({ postedBy: { $in: req.user.following } })
      .populate("postedBy", "_id name")
      .populate("comments.postedBy", "_id name")
      .sort("-createdAt");
    res.json({ posts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/createpost", requireLogin, async (req, res) => {
  const { title, body, pic } = req.body;
  if (!title || !body || !pic) {
    return res.status(422).json({ error: "Please add all the fields" });
  }
  const post = new Post({
    title,
    body,
    photo: pic,
    postedBy: req.user,
  });
  try {
    const result = await post.save();
    res.json({ post: result });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Could not save post" });
  }
});

router.get("/mypost", requireLogin, async (req, res) => {
  try {
    const mypost = await Post.find({ postedBy: req.user._id }).populate(
      "postedBy",
      "_id name"
    );
    res.json({ mypost });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/like", requireLogin, async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    res.status(422).json({ error: err });
  }
});

router.put("/unlike", requireLogin, async (req, res) => {
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $pull: { likes: req.user._id },
      },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    res.status(422).json({ error: err });
  }
});

router.put("/comment", requireLogin, async (req, res) => {
  const comment = {
    text: req.body.text,
    postedBy: req.user._id,
  };
  try {
    const result = await Post.findByIdAndUpdate(
      req.body.postId,
      {
        $push: { comments: comment },
      },
      { new: true }
    )
      .populate("comments.postedBy", "_id name")
      .populate("postedBy", "_id name");
    res.json(result);
  } catch (err) {
    res.status(422).json({ error: err });
  }
});

router.delete("/deletepost/:postId", requireLogin, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId }).populate(
      "postedBy",
      "_id"
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.postedBy._id.toString() === req.user._id.toString()) {
      await post.deleteOne();
      res.json({ message: "Deleted successfully" });
    } else {
      res.status(401).json({ error: "You can only delete your own posts" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Could not delete post" });
  }
});

module.exports = router;
