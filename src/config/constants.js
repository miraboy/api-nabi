module.exports = {
  // API Configuration
  API_VERSION: "/api",

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Status Codes
  STATUS: {
    SUCCESS: "success",
    ERROR: "error",
    FAIL: "fail",
  },

  // Tontine Status
  TONTINE_STATUS: {
    OPEN: "open",
    CLOSED: "closed",
  },

  // Cycle Status
  CYCLE_STATUS: {
    PENDING: "pending",
    ACTIVE: "active",
    COMPLETED: "completed",
  },

  // Round Status
  ROUND_STATUS: {
    PENDING: "pending",
    OPEN: "open",
    CLOSED: "closed",
  },

  // Pickup Policy
  PICKUP_POLICY: {
    ARRIVAL: "arrival",
    RANDOM: "random",
    CUSTOM: "custom",
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: "pending",
    COMPLETED: "completed",
    FAILED: "failed",
  },

  // Frequency
  FREQUENCY: {
    DAILY: "daily",
    WEEKLY: "weekly",
    MONTHLY: "monthly",
    YEARLY: "yearly",
  },
};
