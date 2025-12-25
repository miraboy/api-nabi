const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");
const {
  createPayment,
  getPaymentsByRound,
  getUserPayments,
} = require("../controllers/payment.controller");
const {
  createPaymentValidation,
  roundIdValidation,
} = require("../validators/payment.validators");
const { handleValidationErrors } = require("../middlewares/validator.middleware");

router.use(authenticateToken);

/**
 * @swagger
 * /api/rounds/{roundId}/payments:
 *   post:
 *     summary: Create a payment for a round
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payment created
 *       400:
 *         description: Invalid amount or round not open
 *       403:
 *         description: Not a member
 *       404:
 *         description: Round not found
 *       409:
 *         description: Payment already exists
 */
router.post(
  "/rounds/:roundId/payments",
  createPaymentValidation,
  handleValidationErrors,
  createPayment
);

/**
 * @swagger
 * /api/rounds/{roundId}/payments:
 *   get:
 *     summary: Get all payments for a round
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roundId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of payments
 *       404:
 *         description: Round not found
 */
router.get(
  "/rounds/:roundId/payments",
  roundIdValidation,
  handleValidationErrors,
  getPaymentsByRound
);

/**
 * @swagger
 * /api/users/me/payments:
 *   get:
 *     summary: Get current user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's payments
 */
router.get("/users/me/payments", getUserPayments);

module.exports = router;
