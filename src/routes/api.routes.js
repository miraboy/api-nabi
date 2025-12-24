const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api.controller");

// Health check
router.get("/health", apiController.getHealthStatus);

// Welcome
router.get("/", apiController.getWelcome);

module.exports = router;
