const Tontine = require("../models/Tontine.model");
const TontineMember = require("../models/TontineMember.model");
const Payment = require("../models/Payment.model");
const TontineCycle = require("../models/TontineCycle.model");
const TontineRound = require("../models/TontineRound.model");
const { sendSuccess, sendError } = require("../utils/helpers");
const { getPaginationParams, createPaginatedResponse } = require("../utils/pagination");

/**
 * Create a new tontine
 */
const createTontine = async (req, res) => {
  try {
    const { name, amount, min_members, frequency, pickup_policy } = req.body;
    const ownerId = req.user.id;

    // Create tontine
    const tontine = await Tontine.create(
      name,
      amount,
      min_members,
      frequency,
      ownerId,
      pickup_policy
    );

    // Auto-join creator as first member
    await TontineMember.create(tontine.id, ownerId);

    sendSuccess(
      res,
      {
        id: tontine.id,
        name: tontine.name,
        amount: tontine.amount,
        min_members: tontine.min_members,
        frequency: tontine.frequency,
        pickup_policy: tontine.pickup_policy,
        owner_id: tontine.owner_id,
        status: "open",
      },
      "Tontine created successfully",
      201
    );
  } catch (error) {
    console.error("Create tontine error:", error);
    sendError(res, "Failed to create tontine", 500);
  }
};

/**
 * Get all tontines with pagination
 */
const getAllTontines = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = status ? { status } : {};
    const { page, limit, offset } = getPaginationParams(req.query);

    const [tontines, total] = await Promise.all([
      Tontine.findAll(filters, { limit, offset }),
      Tontine.count(filters)
    ]);

    const response = createPaginatedResponse(tontines, total, page, limit);
    sendSuccess(res, response);
  } catch (error) {
    console.error("Get tontines error:", error);
    sendError(res, "Failed to get tontines", 500);
  }
};

/**
 * Get tontine by ID with details
 */
const getTontineById = async (req, res) => {
  try {
    const { id } = req.params;

    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    // Get members
    const members = await TontineMember.findByTontine(id);

    // Get payments
    const payments = await Payment.findByTontine(id);

    sendSuccess(res, {
      ...tontine,
      members_count: members.length,
      members,
      payments,
    });
  } catch (error) {
    console.error("Get tontine error:", error);
    sendError(res, "Failed to get tontine", 500);
  }
};

/**
 * Join a tontine
 */
const joinTontine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if tontine exists
    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    // Check if tontine is open
    if (tontine.status !== "open") {
      return sendError(res, "Tontine is closed", 400);
    }

    // Check if user is already a member
    const isMember = await TontineMember.isMember(id, userId);
    if (isMember) {
      return sendError(res, "Already a member of this tontine", 409);
    }

    // Add member
    await TontineMember.create(id, userId);

    // Check if min_members reached and auto-close
    const membersCount = await TontineMember.countMembers(id);
    if (membersCount >= tontine.min_members) {
      await Tontine.updateStatus(id, "closed");
    }

    sendSuccess(
      res,
      {
        tontine_id: id,
        user_id: userId,
        status: membersCount >= tontine.min_members ? "closed" : "open",
      },
      "Successfully joined tontine",
      201
    );
  } catch (error) {
    console.error("Join tontine error:", error);
    sendError(res, "Failed to join tontine", 500);
  }
};

/**
 * Make a payment (simulation)
 */
const makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;

    // Check if tontine exists
    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    // Check if user is a member
    const isMember = await TontineMember.isMember(id, userId);
    if (!isMember) {
      return sendError(res, "You must be a member to make a payment", 403);
    }

    // Check if min_members reached
    const membersCount = await TontineMember.countMembers(id);
    if (membersCount < tontine.min_members) {
      return sendError(
        res,
        `Payment not allowed. Minimum ${tontine.min_members} members required, currently ${membersCount}`,
        400
      );
    }

    // Verify amount matches tontine amount
    if (parseFloat(amount) !== parseFloat(tontine.amount)) {
      return sendError(res, `Payment amount must be ${tontine.amount}`, 400);
    }

    // Create payment
    const payment = await Payment.create(id, userId, amount, "completed");

    sendSuccess(
      res,
      {
        id: payment.id,
        tontine_id: payment.tontine_id,
        user_id: payment.user_id,
        amount: payment.amount,
        status: payment.status,
      },
      "Payment successful",
      201
    );
  } catch (error) {
    console.error("Payment error:", error);
    sendError(res, "Payment failed", 500);
  }
};

/**
 * Get tontines where user is owner or member
 */
const getUserTontines = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get tontines where user is owner
    const ownedTontines = await Tontine.findByOwner(userId);

    // Get tontines where user is member
    const memberTontines = await TontineMember.findByUser(userId);

    // Get full tontine details for member tontines
    const memberTontineIds = memberTontines.map((mt) => mt.tontine_id);
    const memberTontineDetails = [];

    for (const id of memberTontineIds) {
      const tontine = await Tontine.findById(id);
      if (tontine && !ownedTontines.find((t) => t.id === id)) {
        memberTontineDetails.push(tontine);
      }
    }

    sendSuccess(res, {
      owned: ownedTontines,
      member: memberTontineDetails,
    });
  } catch (error) {
    console.error("Get user tontines error:", error);
    sendError(res, "Failed to fetch user tontines", 500);
  }
};

/**
 * Update a tontine (owner only)
 */
const updateTontine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, min_members, frequency, pickup_policy } = req.body;
    const tontine = req.tontine; // From isAuthor middleware

    const updatedData = {
      name: name || tontine.name,
      amount: amount || tontine.amount,
      min_members: min_members || tontine.min_members,
      frequency: frequency || tontine.frequency,
      pickup_policy: pickup_policy || tontine.pickup_policy,
    };

    await Tontine.update(id, updatedData);

    sendSuccess(res, { id, ...updatedData }, "Tontine updated successfully");
  } catch (error) {
    console.error("Update tontine error:", error);
    sendError(res, "Failed to update tontine", 500);
  }
};

/**
 * Delete a tontine (owner only)
 */
const deleteTontine = async (req, res) => {
  try {
    const { id } = req.params;

    await Tontine.delete(id);

    sendSuccess(res, null, "Tontine deleted successfully");
  } catch (error) {
    console.error("Delete tontine error:", error);
    sendError(res, "Failed to delete tontine", 500);
  }
};

/**
 * Get members of a tontine (owner only)
 */
const getTontineMembers = async (req, res) => {
  try {
    const { id } = req.params;

    // Get members with their details
    const members = await TontineMember.findByTontine(id);

    sendSuccess(
      res,
      {
        tontine_id: parseInt(id),
        members_count: members.length,
        members,
      },
      "Members retrieved successfully"
    );
  } catch (error) {
    console.error("Get tontine members error:", error);
    sendError(res, "Failed to get tontine members", 500);
  }
};

/**
 * Leave a tontine (member only, after all rounds completed)
 */
const leaveTontine = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if tontine exists
    const tontine = await Tontine.findById(id);
    if (!tontine) {
      return sendError(res, "Tontine not found", 404);
    }

    // Check if user is a member
    const isMember = await TontineMember.isMember(id, userId);
    if (!isMember) {
      return sendError(res, "You are not a member of this tontine", 403);
    }

    // Check if user is the owner (owners cannot leave)
    if (tontine.owner_id === userId) {
      return sendError(res, "Tontine owner cannot leave the tontine", 403);
    }

    // Get all cycles for this tontine
    const cycles = await TontineCycle.findByTontine(id);
    
    // If no cycles exist, member cannot leave (no activity completed)
    if (cycles.length === 0) {
      return sendError(res, "Cannot leave tontine without any completed cycles", 400);
    }

    // Check if there are any active or pending cycles
    const activeCycle = cycles.find(cycle => cycle.status === 'active' || cycle.status === 'pending');
    if (activeCycle) {
      return sendError(res, "Cannot leave tontine while there are active or pending cycles", 400);
    }

    // All cycles must be completed
    const allCompleted = cycles.every(cycle => cycle.status === 'completed');
    if (!allCompleted) {
      return sendError(res, "Cannot leave tontine until all cycles are completed", 400);
    }

    // Verify all rounds in all cycles are completed
    for (const cycle of cycles) {
      const rounds = await TontineRound.findByCycle(cycle.id);
      const incompleteRounds = rounds.filter(round => round.status !== 'closed');
      if (incompleteRounds.length > 0) {
        return sendError(res, "Cannot leave tontine until all rounds are completed", 400);
      }
    }

    // Remove member from tontine
    await TontineMember.delete(id, userId);

    sendSuccess(
      res,
      {
        tontine_id: parseInt(id),
        user_id: userId,
      },
      "Successfully left the tontine"
    );
  } catch (error) {
    console.error("Leave tontine error:", error);
    sendError(res, "Failed to leave tontine", 500);
  }
};

module.exports = {
  createTontine,
  getAllTontines,
  getTontineById,
  joinTontine,
  makePayment,
  getUserTontines,
  updateTontine,
  deleteTontine,
  getTontineMembers,
  leaveTontine,
};
