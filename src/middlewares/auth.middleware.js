const { verifyToken } = require("../utils/auth");
const { sendError } = require("../utils/helpers");
const User = require("../models/User.model");

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return sendError(res, "Access token required", 401);
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return sendError(res, "Invalid or expired token", 401);
    }

    // Get user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Authentication failed", 401);
  }
};

module.exports = authenticateToken;
