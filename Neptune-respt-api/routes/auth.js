const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
// const requireLogin = require("../middleware/requireLogin");
const nodemailer = require("nodemailer");
// const sendgridTransport = require("nodemailer-sendgrid-transport");
const { SENDGRID_API, EMAIL } = require("../config/keys");
//

// const transporter = nodemailer.createTransport(sendgridTransport({
//     auth:{
//         api_key:SENDGRID_API
//     }
// }))

router.post("/signup", async (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!email || !password || !name) {
    return res.status(422).json({ error: "please add all the fields" });
  }
  try {
    const savedUser = await User.findOne({ email });
    if (savedUser) {
      return res
        .status(422)
        .json({ error: "user already exists with that email" });
    }
    const hashedpassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedpassword,
      name,
      pic,
    });
    await user.save();
    res.json({ message: "saved successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to register user" });
  }
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: "please add email or password" });
  }
  try {
    const savedUser = await User.findOne({ email });
    if (!savedUser) {
      return res.status(422).json({ error: "Invalid Email or password" });
    }
    const doMatch = await bcrypt.compare(password, savedUser.password);
    if (doMatch) {
      const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET);
      const { _id, name, email, followers, following, pic } = savedUser;
      res.json({
        token,
        user: { _id, name, email, followers, following, pic },
      });
    } else {
      return res.status(422).json({ error: "Invalid Email or password" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString("hex");
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(422)
        .json({ error: "User doesn't exist with that email" });
    }
    user.resetToken = token;
    user.expireToken = Date.now() + 3600000; // 1 hour
    await user.save();
    // Here you would add your code to send the email
    res.json({ message: "check your email" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.post("/new-password", async (req, res) => {
  const { password: newPassword, token: sentToken } = req.body;
  try {
    const user = await User.findOne({
      resetToken: sentToken,
      expireToken: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(422).json({ error: "Try again session expired" });
    }
    const hashedpassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedpassword;
    user.resetToken = undefined;
    user.expireToken = undefined;
    await user.save();
    res.json({ message: "password updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to update password" });
  }
});

module.exports = router;
