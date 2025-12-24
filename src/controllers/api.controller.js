const { sendSuccess } = require("../utils/helpers");

/**
 * Get API health status
 */
const getHealthStatus = (req, res) => {
  sendSuccess(
    res,
    {
      status: "OK",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    "API is running"
  );
};

/**
 * Get API welcome message
 */
const getWelcome = (req, res) => {
  sendSuccess(res, {
    name: "api-nabi",
    version: "1.0.0",
    description: "Welcome to api-nabi REST API",
  });
};

module.exports = {
  getHealthStatus,
  getWelcome,
};
