const Tontine = require("../models/Tontine.model");
const TontineMember = require("../models/TontineMember.model");
const Payment = require("../models/Payment.model");
const { sendSuccess, sendError } = require("../utils/helpers");

/**
 * Create a new tontine
 */
const createTontine = async (req, res) => {
  try {
    const { name, amount, max_members, frequency } = req.body;
    const ownerId = req.user.id;

    // Create tontine
    const tontine = await Tontine.create(
      name,
      amount,
      max_members,
      frequency,
      ownerId
    );

    // Auto-join creator as first member
    await TontineMember.create(tontine.id, ownerId);

    sendSuccess(
      res,
      {
        id: tontine.id,
        name: tontine.name,
        amount: tontine.amount,
        max_members: tontine.max_members,
        frequency: tontine.frequency,
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
 * Get all tontines
 */
const getAllTontines = async (req, res) => {
  try {
    const { status } = req.query;
    const filters = status ? { status } : {};

    const tontines = await Tontine.findAll(filters);

    sendSuccess(res, tontines);
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

    // Check if tontine is full
    const membersCount = await TontineMember.countMembers(id);
    if (membersCount >= tontine.max_members) {
      return sendError(res, "Tontine is full", 400);
    }

    // Add member
    await TontineMember.create(id, userId);

    sendSuccess(
      res,
      {
        tontine_id: id,
        user_id: userId,
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

module.exports = {
  createTontine,
  getAllTontines,
  getTontineById,
  joinTontine,
  makePayment,
  getUserTontines,
};
