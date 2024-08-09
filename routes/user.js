const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "ddfphyyuu",
  api_key: "258969394663624",
  api_secret: "lPoR2B2uEcMs_mIOnYb4IFJ3M28",
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/signup", fileUpload(), async (req, res) => {
  try {
    const { username, email, password, newsletter } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Please choose an email" });
    }
    if (!username) {
      return res.status(400).json({ message: "Please choose an username" });
    }
    if (!password) {
      return res.status(400).json({ message: "Please choose a password" });
    }
    if (newsletter === undefined) {
      return res
        .status(400)
        .json({ message: "Please choose if you want the newsletter or not" });
    }
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      return res
        .status(409)
        .json({ message: "An account with this email already exist" });
    }

    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    let newUser = new User({
      email: email,
      account: {
        username: username,
      },
      newsletter: newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });
    if (req.files.avatar !== null) {
      const pictureConverted = await cloudinary.uploader.upload(
        convertToBase64(req.files.avatar),
        { folder: `/vinted/user/${newUser._id}` }
      );
      newUser.account.avatar = pictureConverted;
    }

    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar,
      },
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Veuillez entrer un mail" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ message: "Veuillez entrer un mots de passe" });
    }
    const user = await User.findOne({ email: email });
    if (user) {
      const hash = SHA256(password + user.salt).toString(encBase64);

      if (hash === user.hash) {
        res.json({
          _id: user._id,
          token: user.token,
          account: { username: user.account.username },
        });
      } else {
        res.status(400).json({ message: "Wrong password" });
      }
    } else {
      res.status(400).json({ message: "No user with this email" });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
});

module.exports = router;
