const Tontine = require("../models/Tontine.model");
const { sendError } = require("../utils/helpers");

/**
 * Middleware to check if user is the owner of a tontine
 */
const isAuthor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    if (tontine.owner_id !== userId) {
      return sendError(res, "Forbidden: You are not the owner", 403);
    }

    req.tontine = tontine;
    next();
  } catch (error) {
    console.error("Author check error:", error);
    sendError(res, "Authorization check failed", 500);
  }
};

module.exports = isAuthor;
