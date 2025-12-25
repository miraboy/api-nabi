const express = require("express");
const router = express.Router();
const apiController = require("../controllers/api.controller");

// API health routes are public (no authentication required)

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: API is running
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: OK
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                       example: 123.45
 */
// Health check - NO authentication required
router.get("/health", apiController.getHealthStatus);

/**
 * @swagger
 * /api:
 *   get:
 *     summary: Get API welcome message
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Welcome message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
// Welcome - NO authentication required  
router.get("/", apiController.getWelcome);

module.exports = router;
