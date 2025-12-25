const TontineRound = require("../models/TontineRound.model");
const TontineCycle = require("../models/TontineCycle.model");
const Tontine = require("../models/Tontine.model");
const Payment = require("../models/Payment.model");
const { sendSuccess, sendError } = require("../utils/helpers");

/**
 * Get round details
 */
const getRoundById = async (req, res) => {
  try {
    const { roundId } = req.params;

    const round = await TontineRound.findById(roundId);
    if (!round) {
      return sendError(res, "Round not found", 404);
    }

    sendSuccess(res, { round });
  } catch (error) {
    console.error("Get round error:", error);
    sendError(res, "Failed to get round details", 500);
  }
};

/**
 * Close round and open next one
 */
const closeRound = async (req, res) => {
  try {
    const { roundId } = req.params;
    const userId = req.user.id;

    const round = await TontineRound.findById(roundId);
    if (!round) {
      return sendError(res, "Round not found", 404);
    }

    const cycle = await TontineCycle.findById(round.cycle_id);
    if (!cycle) {
      return sendError(res, "Cycle not found", 404);
    }

    const tontine = await Tontine.findById(cycle.tontine_id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    if (tontine.owner_id !== userId) {
      return sendError(res, "Only the owner can close a round", 403);
    }

    if (round.status !== "open") {
      return sendError(res, "Round is not open", 400);
    }

    // Check if all payments are completed
    const payments = await Payment.findByRound(roundId);
    const allPaid = payments.length > 0 && payments.every((p) => p.status === "completed");

    if (!allPaid) {
      return sendError(res, "All payments must be completed before closing", 400);
    }

    // Close current round
    await TontineRound.close(roundId);

    // Check if there's a next round
    const nextRoundNumber = round.round_number + 1;
    if (nextRoundNumber <= cycle.total_rounds) {
      const nextRound = await TontineRound.findByRoundNumber(cycle.id, nextRoundNumber);
      if (nextRound) {
        await TontineRound.start(nextRound.id);
        await TontineCycle.updateCurrentRound(cycle.id, nextRoundNumber);
      }
    } else {
      // Last round, complete the cycle
      await TontineCycle.updateStatus(cycle.id, "completed");
    }

    const updatedRound = await TontineRound.findById(roundId);
    sendSuccess(res, { round: updatedRound }, "Round closed successfully");
  } catch (error) {
    console.error("Close round error:", error);
    sendError(res, error.message || "Failed to close round", 500);
  }
};

module.exports = {
  getRoundById,
  closeRound,
};
