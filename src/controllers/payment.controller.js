const Payment = require("../models/Payment.model");
const TontineRound = require("../models/TontineRound.model");
const TontineCycle = require("../models/TontineCycle.model");
const Tontine = require("../models/Tontine.model");
const TontineMember = require("../models/TontineMember.model");
const { sendSuccess, sendError } = require("../utils/helpers");
const { getPaginationParams, createPaginatedResponse } = require("../utils/pagination");

/**
 * Create a payment for a round
 */
const createPayment = async (req, res) => {
  try {
    const { roundId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    const round = await TontineRound.findById(roundId);
    if (!round) {
      return sendError(res, "Round not found", 404);
    }

    if (round.status !== "open") {
      return sendError(res, "Payments only allowed for open rounds", 400);
    }

    const cycle = await TontineCycle.findById(round.cycle_id);
    const tontine = await Tontine.findById(cycle.tontine_id);

    const member = await TontineMember.findByTontineAndUser(tontine.id, userId);
    if (!member) {
      return sendError(res, "You must be a member of this tontine", 403);
    }

    const existingPayment = await Payment.findByUserAndRound(userId, roundId);
    if (existingPayment) {
      return sendError(res, "Payment already made for this round", 409);
    }

    if (parseFloat(amount) !== parseFloat(tontine.amount)) {
      return sendError(res, `Payment amount must be ${tontine.amount}`, 400);
    }

    const payment = await Payment.create(roundId, userId, amount, "completed");
    sendSuccess(res, { payment }, "Payment created successfully", 201);
  } catch (error) {
    console.error("Create payment error:", error);
    sendError(res, error.message || "Failed to create payment", 500);
  }
};

/**
 * Get payments for a round with pagination
 */
const getPaymentsByRound = async (req, res) => {
  try {
    const { roundId } = req.params;
    const { page, limit, offset } = getPaginationParams(req.query);

    const round = await TontineRound.findById(roundId);
    if (!round) {
      return sendError(res, "Round not found", 404);
    }

    const [payments, total] = await Promise.all([
      Payment.findByRound(roundId, { limit, offset }),
      Payment.countByRound(roundId)
    ]);

    const response = createPaginatedResponse(payments, total, page, limit);
    sendSuccess(res, response);
  } catch (error) {
    console.error("Get payments error:", error);
    sendError(res, "Failed to get payments", 500);
  }
};

/**
 * Get user's payments with pagination
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = getPaginationParams(req.query);

    const [payments, total] = await Promise.all([
      Payment.findByUser(userId, { limit, offset }),
      Payment.countByUser(userId)
    ]);

    const response = createPaginatedResponse(payments, total, page, limit);
    sendSuccess(res, response);
  } catch (error) {
    console.error("Get user payments error:", error);
    sendError(res, "Failed to get payments", 500);
  }
};

module.exports = {
  createPayment,
  getPaymentsByRound,
  getUserPayments,
};
