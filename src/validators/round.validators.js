const { param } = require("express-validator");

const roundIdValidation = [
  param("roundId").isInt().withMessage("Round ID must be an integer"),
];

module.exports = {
  roundIdValidation,
};
