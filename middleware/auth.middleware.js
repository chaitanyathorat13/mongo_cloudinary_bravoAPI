const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User } = require("../model/users.model");

const authMiddleware = async (req, res, next) => {
  let token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, "crt");
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.user = user;
    
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication required" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

const validateResetToken = async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const user = await User.findOne({
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const isTokenValid = await bcrypt.compare(token, user.resetToken);
    if (!isTokenValid) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error(`Error validating reset token: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { authMiddleware, adminMiddleware, validateResetToken };
