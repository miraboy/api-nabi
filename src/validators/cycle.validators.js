const { body, param } = require("express-validator");

/**
 * Validation rules for creating a cycle
 */
const createCycleValidation = [
  param("id")
    .notEmpty()
    .withMessage("Tontine ID is required")
    .isInt({ min: 1 })
    .withMessage("Tontine ID must be a valid positive integer"),
  body("start_date")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date (ISO 8601)"),
  body("end_date")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date (ISO 8601)"),
  body("custom_order")
    .optional()
    .isArray()
    .withMessage("Custom order must be an array of user IDs"),
];

/**
 * Validation rules for cycle ID param
 */
const cycleIdValidation = [
  param("cycleId")
    .notEmpty()
    .withMessage("Cycle ID is required")
    .isInt({ min: 1 })
    .withMessage("Cycle ID must be a valid positive integer"),
];

module.exports = {
  createCycleValidation,
  cycleIdValidation,
};
