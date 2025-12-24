const express = require("express");
const router = express.Router();
const apiRoutes = require("./api.routes");
const { API_VERSION } = require("../config/constants");

// API routes
router.use(API_VERSION, apiRoutes);

// Route de base
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to api-nabi",
    version: API_VERSION,
    endpoints: {
      health: `${API_VERSION}/health`,
      api: API_VERSION,
    },
  });
});

module.exports = router;
