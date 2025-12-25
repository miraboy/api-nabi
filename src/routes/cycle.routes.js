const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");
const {
  createCycle,
  getCycleById,
  getTontineCycles,
  setPayoutOrder,
  startCycle,
  getCycleStats,
} = require("../controllers/cycle.controller");
const {
  createCycleValidation,
  cycleIdValidation,
} = require("../validators/cycle.validators");
const {
  handleValidationErrors,
} = require("../middlewares/validator.middleware");

// All cycle routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/tontines/{id}/cycles:
 *   post:
 *     summary: Create a new cycle for a tontine (owner only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCycleRequest'
 *     responses:
 *       201:
 *         description: Cycle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Tontine not closed or validation error
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Tontine not found
 *       409:
 *         description: Active cycle already exists
 */
router.post(
  "/tontines/:id/cycles",
  createCycleValidation,
  handleValidationErrors,
  createCycle
);

/**
 * @swagger
 * /api/tontines/{id}/cycles:
 *   get:
 *     summary: Get all cycles for a tontine
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Tontine ID
 *     responses:
 *       200:
 *         description: List of cycles
 *       404:
 *         description: Tontine not found
 */
router.get("/tontines/:id/cycles", getTontineCycles);

/**
 * @swagger
 * /api/cycles/{cycleId}:
 *   get:
 *     summary: Get cycle details with payout order and rounds
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     responses:
 *       200:
 *         description: Cycle details
 *       404:
 *         description: Cycle not found
 */
router.get(
  "/cycles/:cycleId",
  cycleIdValidation,
  handleValidationErrors,
  getCycleById
);

/**
 * @swagger
 * /api/cycles/{cycleId}/payout-order:
 *   put:
 *     summary: Set custom payout order for a cycle (owner only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cycle ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custom_order
 *             properties:
 *               custom_order:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of user IDs in desired payout order
 *     responses:
 *       200:
 *         description: Payout order updated successfully
 *       400:
 *         description: Validation error or order is locked
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Cycle not found
 */
router.put(
  "/cycles/:cycleId/payout-order",
  cycleIdValidation,
  handleValidationErrors,
  setPayoutOrder
);

/**
 * @swagger
 * /api/cycles/{cycleId}/start:
 *   post:
 *     summary: Start a cycle (owner only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cycle started
 *       400:
 *         description: Cycle not pending
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Cycle not found
 */
router.post(
  "/cycles/:cycleId/start",
  cycleIdValidation,
  handleValidationErrors,
  startCycle
);

/**
 * @swagger
 * /api/cycles/{cycleId}/stats:
 *   get:
 *     summary: Get cycle statistics (owner only)
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycleId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cycle statistics
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Cycle not found
 */
router.get(
  "/cycles/:cycleId/stats",
  cycleIdValidation,
  handleValidationErrors,
  getCycleStats
);

module.exports = router;
