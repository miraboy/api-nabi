const express = require("express");
const router = express.Router();
const apiRoutes = require("./api.routes");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const tontineRoutes = require("./tontine.routes");
const cycleRoutes = require("./cycle.routes");
const roundRoutes = require("./round.routes");
const paymentRoutes = require("./payment.routes");
const { API_VERSION } = require("../config/constants");

// Public routes (no auth required) - MUST BE FIRST
router.use(API_VERSION, apiRoutes);

// Auth routes (no auth required for register/login)
router.use(`${API_VERSION}/auth`, authRoutes);

// Protected routes (auth required)
router.use(`${API_VERSION}/users`, userRoutes);
router.use(`${API_VERSION}/tontines`, tontineRoutes);
router.use(API_VERSION, cycleRoutes);
router.use(API_VERSION, roundRoutes);
router.use(API_VERSION, paymentRoutes);

// Route de base
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to api-nabi",
    version: API_VERSION,
    endpoints: {
      health: `${API_VERSION}/health`,
      auth: `${API_VERSION}/auth`,
      users: `${API_VERSION}/users`,
      tontines: `${API_VERSION}/tontines`,
      cycles: `${API_VERSION}/cycles`,
      rounds: `${API_VERSION}/rounds`,
      payments: `${API_VERSION}/payments`,
      api: API_VERSION,
    },
  });
});

module.exports = router;
