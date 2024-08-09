const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    } else {
      const token = req.headers.authorization.replace("Bearer ", ""); // je récupère le token dans le header
      const user = await User.findOne({ token: token });
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      } else {
        req.user = user;
      }
      next();
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = isAuthenticated;
