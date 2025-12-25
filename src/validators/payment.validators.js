const { body, param } = require("express-validator");

const createPaymentValidation = [
  param("roundId").isInt().withMessage("Round ID must be an integer"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
];

const roundIdValidation = [
  param("roundId").isInt().withMessage("Round ID must be an integer"),
];

module.exports = {
  createPaymentValidation,
  roundIdValidation,
};
