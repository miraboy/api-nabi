const Tontine = require("../models/Tontine.model");
const TontineMember = require("../models/TontineMember.model");
const TontineCycle = require("../models/TontineCycle.model");
const TontinePayoutOrder = require("../models/TontinePayoutOrder.model");
const TontineRound = require("../models/TontineRound.model");
const { sendSuccess, sendError } = require("../utils/helpers");

/**
 * Generate payout order based on policy
 */
const generatePayoutOrder = async (tontineId, policy, customOrder = null) => {
  const members = await TontineMember.findByTontine(tontineId);

  if (members.length === 0) {
    throw new Error("No members in tontine");
  }

  let orderedMembers = [];

  switch (policy) {
    case "arrival":
      // Order by joined_at (first joined, first served)
      orderedMembers = members.sort(
        (a, b) => new Date(a.joined_at) - new Date(b.joined_at)
      );
      break;

    case "random":
      // Shuffle members randomly
      orderedMembers = [...members].sort(() => Math.random() - 0.5);
      break;

    case "custom":
      // User provides custom order of user IDs
      if (!customOrder || !Array.isArray(customOrder)) {
        throw new Error("Custom order must be an array of user IDs");
      }

      // Validate all members are in custom order
      const memberIds = members.map((m) => m.user_id);
      const customIds = customOrder.map((id) => parseInt(id));

      if (customIds.length !== memberIds.length) {
        throw new Error("Custom order must include all members");
      }

      const missingIds = memberIds.filter((id) => !customIds.includes(id));
      if (missingIds.length > 0) {
        throw new Error(
          `Missing member IDs in custom order: ${missingIds.join(", ")}`
        );
      }

      // Order members according to custom order
      orderedMembers = customIds.map((id) =>
        members.find((m) => m.user_id === id)
      );
      break;

    default:
      throw new Error("Invalid pickup policy");
  }

  return orderedMembers.map((member, index) => ({
    userId: member.user_id,
    position: index + 1,
  }));
};

/**
 * Create a new cycle for a tontine
 */
const createCycle = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, custom_order } = req.body;
    const userId = req.user.id;

    // Check if tontine exists
    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    // Check if user is owner
    if (tontine.owner_id !== userId) {
      return sendError(res, "Only the owner can create a cycle", 403);
    }

    // Check if tontine is closed
    if (tontine.status !== "closed") {
      return sendError(
        res,
        "Tontine must be closed before starting a cycle",
        400
      );
    }

    // Check if there's already an active or pending cycle
    const activeCycle = await TontineCycle.findActiveCycle(id);
    if (activeCycle) {
      return sendError(
        res,
        `A cycle is already ${activeCycle.status} for this tontine`,
        409
      );
    }

    // Get members count
    const members = await TontineMember.findByTontine(id);
    const totalRounds = members.length;

    if (totalRounds === 0) {
      return sendError(res, "Cannot create cycle without members", 400);
    }

    // Create cycle
    const cycle = await TontineCycle.create(
      id,
      start_date,
      end_date,
      totalRounds
    );

    // Generate payout order
    const payoutOrder = await generatePayoutOrder(
      id,
      tontine.pickup_policy,
      custom_order
    );

    // Save payout order
    await TontinePayoutOrder.bulkCreate(cycle.id, payoutOrder);

    // Create all rounds
    for (let i = 0; i < payoutOrder.length; i++) {
      await TontineRound.create(cycle.id, i + 1, payoutOrder[i].userId);
    }

    // Get complete cycle info
    const payoutOrderDetails = await TontinePayoutOrder.findByCycle(cycle.id);
    const rounds = await TontineRound.findByCycle(cycle.id);

    sendSuccess(
      res,
      {
        cycle: {
          ...cycle,
          payout_order: payoutOrderDetails,
          rounds,
        },
      },
      "Cycle created successfully",
      201
    );
  } catch (error) {
    console.error("Create cycle error:", error);
    sendError(res, error.message || "Failed to create cycle", 500);
  }
};

/**
 * Get cycle details
 */
const getCycleById = async (req, res) => {
  try {
    const { cycleId } = req.params;

    const cycle = await TontineCycle.findById(cycleId);
    if (!cycle) {
      return sendError(res, "Cycle not found", 404);
    }

    const payoutOrder = await TontinePayoutOrder.findByCycle(cycleId);
    const rounds = await TontineRound.findByCycle(cycleId);

    sendSuccess(res, {
      ...cycle,
      payout_order: payoutOrder,
      rounds,
    });
  } catch (error) {
    console.error("Get cycle error:", error);
    sendError(res, "Failed to get cycle details", 500);
  }
};

/**
 * Get all cycles for a tontine
 */
const getTontineCycles = async (req, res) => {
  try {
    const { id } = req.params;

    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    const cycles = await TontineCycle.findByTontine(id);

    sendSuccess(res, { cycles });
  } catch (error) {
    console.error("Get cycles error:", error);
    sendError(res, "Failed to get cycles", 500);
  }
};

module.exports = {
  createCycle,
  getCycleById,
  getTontineCycles,
};
