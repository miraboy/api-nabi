const { body, param } = require("express-validator");

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

/**
 * Validation rules for creating a tontine
 */
const createTontineValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => value > 0)
    .withMessage("Amount must be greater than 0"),
  body("min_members")
    .notEmpty()
    .withMessage("Min members is required")
    .isInt({ min: 2 })
    .withMessage("Min members must be at least 2"),
  body("frequency")
    .trim()
    .notEmpty()
    .withMessage("Frequency is required")
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Frequency must be one of: daily, weekly, monthly, yearly"),
];

/**
 * Validation rules for tontine ID param
 */
const tontineIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Tontine ID is required")
    .isInt({ min: 1 })
    .withMessage("Tontine ID must be a valid positive integer"),
];

/**
 * Validation rules for making a payment
 */
const makePaymentValidation = [
  ...tontineIdValidation,
  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => value > 0)
    .withMessage("Amount must be greater than 0"),
];

/**
 * Validation rules for updating a tontine
 */
const updateTontineValidation = [
  ...tontineIdValidation,
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters"),
  body("amount")
    .optional()
    .isNumeric()
    .withMessage("Amount must be a number")
    .custom((value) => value > 0)
    .withMessage("Amount must be greater than 0"),
  body("min_members")
    .optional()
    .isInt({ min: 2 })
    .withMessage("Min members must be at least 2"),
  body("frequency")
    .optional()
    .trim()
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Frequency must be one of: daily, weekly, monthly, yearly"),
];

module.exports = {
  registerValidation,
  loginValidation,
  createTontineValidation,
  tontineIdValidation,
  makePaymentValidation,
  updateTontineValidation,
};
