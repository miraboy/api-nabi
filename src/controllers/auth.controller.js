const User = require("../models/User.model");
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("../utils/auth");
const { sendSuccess, sendError } = require("../utils/helpers");

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return sendError(res, "Name, email and password are required", 400);
    }

    if (password.length < 6) {
      return sendError(res, "Password must be at least 6 characters", 400);
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return sendError(res, "Email already registered", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create(name, email, passwordHash);

    // Generate token
    const token = generateToken(user.id);

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    sendError(res, "Registration failed", 500);
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return sendError(res, "Invalid credentials", 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return sendError(res, "Invalid credentials", 401);
    }

    // Generate token
    const token = generateToken(user.id);

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      },
      "Login successful"
    );
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, "Login failed", 500);
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    // Client should remove the token from storage
    sendSuccess(res, null, "Logout successful");
  } catch (error) {
    console.error("Logout error:", error);
    sendError(res, "Logout failed", 500);
  }
};

module.exports = {
  register,
  login,
  logout,
};
