const express = require("express");
const router = express.Router();
const apiRoutes = require("./api.routes");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const { API_VERSION } = require("../config/constants");

// API routes
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/users`, userRoutes);
router.use(API_VERSION, apiRoutes);

// Route de base
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to api-nabi",
    version: API_VERSION,
    endpoints: {
      health: `${API_VERSION}/health`,
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      api: API_VERSION,
    },
  });
});

module.exports = router;
