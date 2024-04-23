const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("Post");
const User = mongoose.model("User");

router.get("/user/:id", requireLogin, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const posts = await Post.find({ postedBy: req.params.id }).populate(
      "postedBy",
      "_id name"
    );
    res.json({ user, posts });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/follow", requireLogin, async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      req.body.followId,
      {
        $push: { followers: req.user._id },
      },
      { new: true }
    );
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { following: req.body.followId },
      },
      { new: true }
    ).select("-password");
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(422).json({ error: err.message });
  }
});

router.put("/unfollow", requireLogin, async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      req.body.unfollowId,
      {
        $pull: { followers: req.user._id },
      },
      { new: true }
    );
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body.unfollowId },
      },
      { new: true }
    ).select("-password");
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(422).json({ error: err.message });
  }
});

router.put("/updatepic", requireLogin, async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: { pic: req.body.pic },
      },
      { new: true }
    );
    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(422).json({ error: "pic cannot post" });
  }
});

router.post("/search-users", async (req, res) => {
  let userPattern = new RegExp("^" + req.body.query);
  try {
    const users = await User.find({ email: { $regex: userPattern } }).select(
      "_id email"
    );
    res.json({ user: users });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
