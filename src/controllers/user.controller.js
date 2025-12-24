const User = require("../models/User.model");
const { sendSuccess, sendError } = require("../utils/helpers");

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    sendSuccess(res, {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    sendError(res, "Failed to get profile", 500);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name && !email) {
      return sendError(res, "Name or email required", 400);
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        return sendError(res, "Email already in use", 409);
      }
    }

    // Update user
    await User.update(req.user.id, {
      name: name || req.user.name,
      email: email || req.user.email,
    });

    const updatedUser = await User.findById(req.user.id);

    sendSuccess(
      res,
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
      "Profile updated successfully"
    );
  } catch (error) {
    console.error("Update profile error:", error);
    sendError(res, "Failed to update profile", 500);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
