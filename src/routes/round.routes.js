const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/auth.middleware");
const { getRoundById, closeRound } = require("../controllers/round.controller");
const { roundIdValidation } = require("../validators/round.validators");
const { handleValidationErrors } = require("../middlewares/validator.middleware");

// All round routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/rounds/{roundId}:
 *   get:
 *     summary: Get round details
 *     tags: [Rounds]
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
 *         description: Round details
 *       404:
 *         description: Round not found
 */
router.get("/rounds/:roundId", roundIdValidation, handleValidationErrors, getRoundById);

/**
 * @swagger
 * /api/rounds/{roundId}/close:
 *   post:
 *     summary: Close round and open next one (owner only)
 *     tags: [Rounds]
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
 *         description: Round closed successfully
 *       400:
 *         description: Round not open or payments incomplete
 *       403:
 *         description: Not the owner
 *       404:
 *         description: Round not found
 */
router.post("/rounds/:roundId/close", roundIdValidation, handleValidationErrors, closeRound);

module.exports = router;
