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

/**
 * Set custom payout order for a cycle
 */
const setPayoutOrder = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { custom_order } = req.body;
    const userId = req.user.id;

    const cycle = await TontineCycle.findById(cycleId);
    if (!cycle) {
      return sendError(res, "Cycle not found", 404);
    }

    const tontine = await Tontine.findById(cycle.tontine_id);
    if (tontine.owner_id !== userId) {
      return sendError(res, "Only the owner can set payout order", 403);
    }

    if (cycle.status !== "pending") {
      return sendError(res, "Can only modify order before cycle starts", 400);
    }

    const members = await TontineMember.findByTontine(cycle.tontine_id);
    const memberIds = members.map((m) => m.user_id);
    const customIds = custom_order.map((id) => parseInt(id));

    if (customIds.length !== memberIds.length) {
      return sendError(res, "Custom order must include all members", 400);
    }

    const missingIds = memberIds.filter((id) => !customIds.includes(id));
    if (missingIds.length > 0) {
      return sendError(
        res,
        `Missing member IDs: ${missingIds.join(", ")}`,
        400
      );
    }

    await TontinePayoutOrder.deleteForCycle(cycleId);
    const payoutOrder = customIds.map((id, index) => ({
      userId: id,
      position: index + 1,
    }));
    await TontinePayoutOrder.bulkCreate(cycleId, payoutOrder);

    const updatedOrder = await TontinePayoutOrder.findByCycle(cycleId);
    sendSuccess(res, { payout_order: updatedOrder }, "Payout order updated");
  } catch (error) {
    console.error("Set payout order error:", error);
    sendError(res, error.message || "Failed to set payout order", 500);
  }
};

/**
 * Start a cycle
 */
const startCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.id;

    const cycle = await TontineCycle.findById(cycleId);
    if (!cycle) {
      return sendError(res, "Cycle not found", 404);
    }

    const tontine = await Tontine.findById(cycle.tontine_id);
    if (tontine.owner_id !== userId) {
      return sendError(res, "Only the owner can start a cycle", 403);
    }

    if (cycle.status !== "pending") {
      return sendError(res, "Cycle is not pending", 400);
    }

    await TontineCycle.updateStatus(cycleId, "active");
    await TontineCycle.updateCurrentRound(cycleId, 1);

    const firstRound = await TontineRound.findByRoundNumber(cycleId, 1);
    if (firstRound) {
      await TontineRound.start(firstRound.id);
    }

    const updatedCycle = await TontineCycle.findById(cycleId);
    sendSuccess(res, { cycle: updatedCycle }, "Cycle started successfully");
  } catch (error) {
    console.error("Start cycle error:", error);
    sendError(res, error.message || "Failed to start cycle", 500);
  }
};

/**
 * Get cycle statistics for owner
 */
const getCycleStats = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userId = req.user.id;

    const cycle = await TontineCycle.findById(cycleId);
    if (!cycle) {
      return sendError(res, "Cycle not found", 404);
    }

    const tontine = await Tontine.findById(cycle.tontine_id);
    if (tontine.owner_id !== userId) {
      return sendError(res, "Only the owner can view cycle stats", 403);
    }

    const Payment = require("../models/Payment.model");
    const members = await TontineMember.findByTontine(cycle.tontine_id);
    const payoutOrder = await TontinePayoutOrder.findByCycle(cycleId);
    const rounds = await TontineRound.findByCycle(cycleId);
    const currentRound = rounds.find(r => r.status === "open");

    let membersPaid = [];
    let membersNotPaid = [];
    let membersCollected = [];

    if (currentRound) {
      const payments = await Payment.findByRound(currentRound.id);
      const paidUserIds = payments.map(p => p.user_id);

      membersPaid = members.filter(m => paidUserIds.includes(m.user_id));
      membersNotPaid = members.filter(m => !paidUserIds.includes(m.user_id));
    } else {
      membersNotPaid = members;
    }

    membersCollected = payoutOrder.filter(po => po.has_collected);

    const remainingRounds = cycle.total_rounds - cycle.current_round;

    sendSuccess(res, {
      cycle_id: cycleId,
      current_round: cycle.current_round,
      total_rounds: cycle.total_rounds,
      remaining_rounds: remainingRounds,
      members_paid: membersPaid.map(m => ({ user_id: m.user_id, name: m.name, email: m.email })),
      members_not_paid: membersNotPaid.map(m => ({ user_id: m.user_id, name: m.name, email: m.email })),
      members_collected: membersCollected.map(mc => ({ user_id: mc.user_id, name: mc.name, position: mc.position })),
    });
  } catch (error) {
    console.error("Get cycle stats error:", error);
    sendError(res, error.message || "Failed to get cycle stats", 500);
  }
};

module.exports = {
  createCycle,
  getCycleById,
  getTontineCycles,
  setPayoutOrder,
  startCycle,
  getCycleStats,
};
